# SPEC-GUARD-001: Implementation Plan

```yaml
spec_id: SPEC-GUARD-001
title: Guarded Compliance & Objective Surfacing
version: 1.0.0
status: draft
created: 2026-02-03
updated: 2026-02-03
```

---

## 1. Implementation Overview

This plan covers the implementation of two post-regeneration evaluation subsystems for CoWriThink:

- **Pushback (Feature 4):** GPT-4o-powered evaluation of regenerated text, with inline warnings and side panel integration.
- **Process 2 / Objective Surfacing (Feature 5):** GPT-4o-powered misalignment detection between user actions and writing goal, with notification bar UI.

Both features are tightly coupled with the regeneration pipeline from SPEC-INTERACT-001 and the editor/provenance layer from SPEC-CORE-001.

---

## 2. Milestones

### Milestone 1: Pushback Evaluation Engine (Priority High -- Primary Goal)

**Scope:** Core pushback evaluation logic, GPT-4o prompt, and response parsing.

**Tasks:**

- Design and implement the pushback evaluation system prompt for GPT-4o
- Create the `PushbackEvaluator` service that accepts regenerated segments, context, and goal
- Implement response parsing to extract flagged segments with trigger category, explanation, and suggested edit
- Implement authorship-aware confidence thresholds (higher threshold for user-written text)
- Integrate with the regeneration pipeline: call evaluator after regeneration completes, before diff view is finalized
- Handle API failures gracefully (silent failure, console log, no user-facing error)
- Write unit tests for prompt construction and response parsing

**Deliverables:**
- `src/services/pushback-evaluator.ts`
- `src/types/pushback.ts`
- Tests for evaluator service

---

### Milestone 2: Pushback UI Components (Priority High -- Primary Goal)

**Scope:** Inline warning highlights, tooltips, and side panel Pushback Comments section.

**Tasks:**

- Create a TipTap decoration plugin for orange/warning highlight on flagged segments
- Implement tooltip component with explanation text, trigger category badge, and action buttons
- Implement "Keep anyway" button handler: dismiss warning, log `pushback-override` to provenance
- Implement "Accept suggestion" button handler: apply edit, dismiss warning, log `pushback-accepted` to provenance
- Build the Pushback Comments section in the side panel:
  - List of active pushback flags with excerpt, category, explanation
  - Action buttons mirroring inline tooltips
  - Active count in section header
  - Auto-removal on resolution
- Ensure multiple simultaneous flags render correctly without overlap
- Ensure orange highlight is visually distinct from all other text states

**Deliverables:**
- `src/components/editor/pushback-decoration.ts` (TipTap plugin)
- `src/components/editor/PushbackTooltip.tsx`
- `src/components/side-panel/PushbackComments.tsx`
- Integration with provenance store

---

### Milestone 3: Process 2 Evaluation Engine (Priority High -- Primary Goal)

**Scope:** Misalignment detection logic, GPT-4o prompt, idle detection, and deduplication.

**Tasks:**

- Design and implement the Process 2 evaluation system prompt for GPT-4o
- Create the `ObjectiveMonitor` service that accepts document state, marking history, goal, and dismissed observations
- Implement response parsing to extract misalignment description and 2-3 direction options
- Implement vague goal detection: when GPT-4o determines the goal is too vague, include a refinement suggestion as one of the options
- Implement idle detection algorithm (see Section 4)
- Implement dismissed observation storage and semantic deduplication (see Section 5)
- Integrate with the regeneration pipeline: start idle timer after regeneration completes
- Handle API failures gracefully (silent failure, suppress notification)
- Write unit tests for prompt construction, response parsing, and idle detection

**Deliverables:**
- `src/services/objective-monitor.ts`
- `src/services/idle-detector.ts`
- `src/types/process2.ts`
- Tests for monitor service and idle detection

---

### Milestone 4: Process 2 UI -- Notification Bar (Priority High -- Primary Goal)

**Scope:** Non-blocking notification bar at bottom of editor with direction options.

**Tasks:**

- Build `MisalignmentNotificationBar` component:
  - Positioned at bottom of editor (below prompt bar, above viewport edge)
  - Contains misalignment description text
  - Radio-button selection for 2-3 direction options
  - "Apply selected" and "Dismiss" buttons
  - Does not block or overlay editor content
  - Does not shift editor scroll position on appear/disappear
- Implement "Apply selected" handler:
  - Update writing goal in goal state (header + side panel)
  - Log `process2-applied` to provenance store
  - Dismiss notification bar
- Implement "Dismiss" handler:
  - Store dismissed observation in session state
  - Log `process2-dismissed` to provenance store
  - Dismiss notification bar
- Implement re-check suppression: if user resumes activity before notification renders, suppress until next idle window

**Deliverables:**
- `src/components/editor/MisalignmentNotificationBar.tsx`
- Integration with goal state management
- Integration with provenance store

---

### Milestone 5: Integration Testing and Prompt Tuning (Priority High -- Secondary Goal)

**Scope:** End-to-end testing, false positive rate tuning, and UX polish.

**Tasks:**

- End-to-end test: full cycle from regeneration through pushback display and resolution
- End-to-end test: full cycle from regeneration through idle detection, Process 2 notification, and goal update
- Tune pushback evaluation prompt to minimize false positive rate (target: fewer than 1 in 5 regenerations trigger pushback under normal use)
- Tune Process 2 evaluation prompt to minimize false detection of intentional direction changes
- Test edge cases:
  - Multiple pushback flags in one regeneration
  - Pushback on user-written text (confirm higher threshold applies)
  - Process 2 with vague goal (confirm refinement suggestion appears)
  - Rapid regeneration cycles (confirm Process 2 waits for idle)
  - Dismiss then re-trigger with new evidence (confirm deduplication works)
- Accessibility testing: keyboard navigation for tooltips and notification bar

**Deliverables:**
- Integration test suite
- Tuned system prompts with documented prompt engineering decisions

---

### Milestone 6: Provenance Integration (Priority Medium -- Secondary Goal)

**Scope:** Ensure all pushback and Process 2 events are logged consistently.

**Tasks:**

- Define provenance event types for pushback and Process 2:
  - `pushback-shown`: flag displayed to user
  - `pushback-override`: user clicked "Keep anyway"
  - `pushback-accepted`: user clicked "Accept suggestion"
  - `process2-shown`: notification bar displayed
  - `process2-applied`: user selected and applied a direction
  - `process2-dismissed`: user dismissed the notification
  - `goal-updated-via-process2`: goal changed as result of Process 2
- Integrate event logging at each handler point
- Verify events appear in session export JSON

**Deliverables:**
- Updated provenance event types in `src/types/provenance.ts`
- Event logging integration across all handlers

---

## 3. Pushback Evaluation Prompt Design

### System Prompt Structure

```
You are a writing quality evaluator for an AI-assisted writing tool.
The user has a stated writing goal and is iteratively refining their
text through a marking-and-regeneration process.

Your task: evaluate the REGENERATED segments (marked below) for three
types of issues:

1. GOAL CONTRADICTION: Does any regenerated segment argue against or
   undermine the user's stated goal?
2. STRUCTURAL COHERENCE: Does removing/replacing original text with
   regenerated text break the logical flow of the argument?
3. QUALITY CONCERN: Is any regenerated or preserved segment vague,
   cliched, unsupported, or substantially weaker than what it replaced?

IMPORTANT GUIDELINES:
- Be conservative. Only flag CLEAR issues. When in doubt, do not flag.
- For user-written segments, apply an EVEN HIGHER threshold. Flag only
  obvious structural or factual problems, never stylistic preferences.
- Each flag must include a specific, actionable explanation.
- Each flag should include a concrete suggested edit when possible.
- Return an empty array if no issues are found.

USER'S GOAL:
{goal}

PRESERVED CONTEXT (do not evaluate, use for coherence checking):
{preservedSegments}

REGENERATED SEGMENTS TO EVALUATE:
{regeneratedSegments}

SEGMENT AUTHORSHIP:
{authorshipMap}

Respond in JSON format:
{
  "flags": [
    {
      "segmentId": "...",
      "triggerCategory": "goal-contradiction" | "structural-coherence" | "quality-concern",
      "explanation": "...",
      "suggestedEdit": "..." | null
    }
  ]
}
```

### Key Prompt Design Decisions

| Decision                        | Rationale                                                    |
|---------------------------------|--------------------------------------------------------------|
| Conservative flagging directive | Minimizes false positives, which are the primary trust risk  |
| Authorship-aware thresholds     | Respects writer autonomy; system is cautious with user text  |
| Structured JSON output          | Enables reliable parsing and segment-level mapping           |
| Suggested edit included         | Provides actionable "Accept suggestion" content              |
| Single API call                 | Reduces latency; all three categories evaluated together     |

---

## 4. Idle Detection Algorithm

### Design

```
STATE: idle_timer = null
STATE: regeneration_just_completed = false
CONST: IDLE_THRESHOLD = 5000 (milliseconds, configurable)

ON regeneration_complete:
  regeneration_just_completed = true
  reset_idle_timer()

ON user_activity (keypress, mousedown, marking, editing):
  regeneration_just_completed = false  // only if timer was not already running
  reset_idle_timer()

FUNCTION reset_idle_timer():
  clear(idle_timer)
  idle_timer = setTimeout(on_idle, IDLE_THRESHOLD)

FUNCTION on_idle():
  IF regeneration_just_completed:
    trigger_process2_evaluation()
    regeneration_just_completed = false
```

### Key Design Decisions

| Decision                              | Rationale                                                     |
|---------------------------------------|---------------------------------------------------------------|
| Timer resets on ANY user activity      | Ensures Process 2 never fires during active interaction       |
| Requires `regeneration_just_completed` | Process 2 only evaluates after a regeneration, not random pauses |
| Configurable threshold                 | Allows tuning during user study without code changes          |
| Suppression on resume                  | If user resumes before notification renders, cancel silently  |

---

## 5. Misalignment Deduplication Logic

### Design

Dismissed observations are stored as an array of `DismissedObservation` objects in session state (localStorage-backed React state).

When the Objective Monitor returns a new misalignment detection:

1. Compare the new detection's description against all dismissed descriptions
2. Use a lightweight string similarity check (normalized Levenshtein distance or cosine similarity on word tokens)
3. If similarity exceeds threshold (default: 0.7), suppress the notification
4. If similarity is below threshold, display the notification

### Alternative: LLM-Based Deduplication

For higher accuracy, the deduplication check can be included in the Process 2 evaluation prompt itself:

```
Previously dismissed observations (do not re-trigger if substantially similar):
{dismissedDescriptions}
```

This approach offloads deduplication to GPT-4o at the cost of including dismissed descriptions in each evaluation call. Recommended for the prototype due to simplicity.

---

## 6. Process 2 Evaluation Prompt Design

### System Prompt Structure

```
You are an objective alignment monitor for an AI-assisted writing tool.
The user has a stated writing goal and is iteratively refining their
text through marking and regeneration.

Your task: determine whether the user's recent actions (marking patterns,
edits, regeneration results) have drifted from their stated goal.

ANALYSIS GUIDELINES:
- Only flag GENUINE misalignment. Intentional exploration of
  sub-topics that serve the goal is NOT misalignment.
- If the goal is vague, you may suggest goal refinement as one option.
- Generate 2-3 concrete direction options that the user can select.
- Each option must include a proposed goal update string.
- If no misalignment is detected, return { "misaligned": false }.

PREVIOUSLY DISMISSED OBSERVATIONS (do not re-trigger if similar):
{dismissedObservations}

USER'S GOAL:
{goal}

CURRENT DOCUMENT STATE:
{documentText}

RECENT MARKING/EDITING HISTORY:
{recentHistory}

Respond in JSON format:
{
  "misaligned": true | false,
  "description": "...",
  "options": [
    {
      "label": "...",
      "description": "...",
      "proposedGoalUpdate": "..."
    }
  ]
}
```

---

## 7. Goal Update Flow

When a user selects a Process 2 direction option and clicks "Apply selected":

```
1. Read selected option's `proposedGoalUpdate` string
2. Update goal state:
   a. Set current goal to proposedGoalUpdate
   b. Update goal display in editor header (collapsed view)
   c. Update goal in side panel Goal section
   d. Add entry to goalHistory array with:
      - oldGoal
      - newGoal
      - source: 'process2'
      - selectedOptionLabel
      - timestamp
3. Log provenance event:
   - type: 'goal-updated-via-process2'
   - data: { oldGoal, newGoal, source: 'process2', optionId }
4. Dismiss notification bar
5. Clear: the next pushback evaluation and Process 2 check
   will use the updated goal
```

---

## 8. Component Architecture

### Component Tree

```
EditorLayout (SPEC-CORE-001)
  |
  +-- EditorArea
  |     +-- TipTapEditor
  |     |     +-- PushbackDecorationPlugin (orange highlights)
  |     |     +-- PushbackTooltip (hover tooltip per flag)
  |     |
  |     +-- MisalignmentNotificationBar (bottom, non-blocking)
  |
  +-- SidePanel (SPEC-CORE-001)
  |     +-- GoalSection (updated by Process 2)
  |     +-- PushbackComments (active flags list)
  |     +-- RoundHistory
  |     +-- DocumentOutline
  |
  +-- PromptBar (SPEC-INTERACT-001)
```

### Service Architecture

```
RegenerationPipeline (SPEC-INTERACT-001)
  |
  |-- on complete --> PushbackEvaluator
  |                     |-- evaluates segments via GPT-4o
  |                     |-- returns PushbackFlag[]
  |                     |-- updates PushbackStore (React state)
  |
  |-- on complete --> IdleDetector
                        |-- monitors user activity
                        |-- on idle --> ObjectiveMonitor
                                          |-- evaluates alignment via GPT-4o
                                          |-- checks deduplication
                                          |-- returns MisalignmentNotification | null
                                          |-- updates Process2Store (React state)
```

### State Management

| Store              | Contents                            | Persistence        |
|--------------------|-------------------------------------|---------------------|
| PushbackStore      | Active PushbackFlag array           | React state only    |
| Process2Store      | Active notification, dismissed list | React state + localStorage (dismissed list) |
| GoalStore          | Current goal, goal history          | localStorage (SPEC-CORE-001) |
| ProvenanceStore    | Event log                           | localStorage (SPEC-CORE-001) |

---

## 9. Risk Analysis

| Risk                                  | Severity | Likelihood | Mitigation                                                   |
|---------------------------------------|----------|------------|--------------------------------------------------------------|
| **High false positive rate (pushback)** | High     | Medium     | Conservative prompt design; higher threshold for user-written text; iterative prompt tuning with test corpus |
| **High false positive rate (Process 2)** | Medium  | Medium     | Include deduplication in prompt; require genuine divergence, not sub-topic exploration |
| **Pushback evaluation latency**        | Medium   | Medium     | Show diff view immediately, then overlay warnings as they arrive; use streaming if available |
| **Process 2 interrupts editing**       | High     | Low        | Idle detection with activity monitoring; suppress if user resumes before render |
| **GPT-4o API failure**                 | Low      | Low        | Silent failure: no pushback shown, no Process 2 triggered; console log for debugging |
| **Tooltip z-index conflicts with diff view** | Low | Medium    | Explicit z-index layering strategy; tooltip renders in portal above editor |
| **Notification bar shifts scroll position** | Medium | Medium   | Use fixed positioning relative to editor container; add/remove without affecting content flow |
| **localStorage overflow on long sessions** | Low    | Low       | Dismissed observations are lightweight; monitor storage usage; warn if approaching limit |
| **User confusion: pushback vs Process 2** | Medium  | Medium     | Visually distinct UI: orange inline for pushback vs bottom bar for Process 2; different interaction models |

---

## 10. Dependencies and Integration Points

| Integration Point                    | Source SPEC        | Required API/Interface                         |
|--------------------------------------|--------------------|------------------------------------------------|
| Regeneration pipeline completion     | SPEC-INTERACT-001  | Callback/event after regeneration returns       |
| Regenerated segments with metadata   | SPEC-INTERACT-001  | Segment array with IDs, text, positions         |
| Text state / authorship tracking     | SPEC-CORE-001      | Segment authorship type lookup                  |
| Writing goal (current)               | SPEC-CORE-001      | Goal string from GoalStore                      |
| Provenance store                     | SPEC-CORE-001      | ProvenanceEvent logging API                     |
| Side panel Pushback Comments slot    | SPEC-CORE-001      | Designated section in side panel layout          |
| Goal update mechanism                | SPEC-CORE-001      | Goal setter function + goal history tracking     |
| TipTap decoration API                | SPEC-CORE-001      | TipTap plugin registration for custom decorations|
| GPT-4o API client                    | SPEC-INTERACT-001  | Shared OpenAI client with API key management     |
