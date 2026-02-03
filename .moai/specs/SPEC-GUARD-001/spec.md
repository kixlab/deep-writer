# SPEC-GUARD-001: Guarded Compliance & Objective Surfacing

```yaml
id: SPEC-GUARD-001
title: Guarded Compliance & Objective Surfacing
version: 1.0.0
status: draft
created: 2026-02-03
updated: 2026-02-03
author: Dr.WriThink
priority: P1
depends_on:
  - SPEC-CORE-001
  - SPEC-INTERACT-001
tags:
  - pushback
  - guarded-compliance
  - objective-surfacing
  - process-2
  - misalignment-detection
```

---

## HISTORY

| Version | Date       | Author      | Description                          |
|---------|------------|-------------|--------------------------------------|
| 1.0.0   | 2026-02-03 | Dr.WriThink | Initial SPEC creation (draft)       |

---

## 1. Environment

### 1.1 System Context

CoWriThink is an AI-assisted writing tool designed to promote writer autonomy. The system uses a marking-based interaction model where users mark text segments for preservation or deletion, then trigger AI regeneration to fill gaps. This SPEC covers two post-regeneration subsystems:

- **Feature 4 (Guarded Compliance / Pushback):** Evaluates regenerated results and flags potential issues with inline warnings.
- **Feature 5 (Process 2 / Objective Surfacing):** Detects misalignment between user actions and stated goal, offering direction options via a notification bar.

### 1.2 Technology Stack

| Component         | Technology                              |
|-------------------|-----------------------------------------|
| Framework         | Next.js 15 App Router                  |
| UI Library        | React 19                                |
| Editor            | TipTap / ProseMirror                    |
| Styling           | Tailwind CSS                            |
| Storage           | localStorage                            |
| AI Provider       | OpenAI GPT-4o                           |
| Deployment        | Greenfield prototype for user study     |

### 1.3 Actors

| Actor        | Description                                              |
|--------------|----------------------------------------------------------|
| Writer       | The human user composing text in the editor               |
| Pushback Evaluator | GPT-4o evaluation layer for post-regeneration quality checks |
| Objective Monitor  | GPT-4o evaluation layer for goal-action misalignment detection |

### 1.4 Dependencies

| Dependency       | SPEC ID          | Required Components                                      |
|------------------|------------------|----------------------------------------------------------|
| Core Editor      | SPEC-CORE-001    | TipTap editor instance, text state management, provenance store, side panel layout, goal display |
| Interaction Layer| SPEC-INTERACT-001| Marking system, regeneration pipeline, GPT-4o API integration, diff view rendering |

---

## 2. Assumptions

| ID   | Assumption                                                                                     | Confidence | Risk if Wrong                                      |
|------|-----------------------------------------------------------------------------------------------|------------|---------------------------------------------------|
| A-01 | GPT-4o can reliably evaluate goal contradiction, structural coherence, and quality concerns in a single evaluation pass | Medium | Pushback triggers are unreliable, producing excessive false positives or false negatives |
| A-02 | The regeneration pipeline from SPEC-INTERACT-001 returns structured output that can be inspected segment-by-segment | High | Pushback evaluator cannot isolate which segments to flag |
| A-03 | User idle detection (no active marking/editing) can be reliably determined via a configurable timeout | High | Process 2 interrupts active editing, violating the non-interruption guarantee |
| A-04 | Pushback evaluation completes within an acceptable latency (under 3 seconds) so the user does not perceive significant delay after regeneration | Medium | Users abandon the pushback feature or perceive the system as slow |
| A-05 | localStorage is sufficient for storing pushback history and dismissed misalignment observations for the prototype | High | Session data loss or storage overflow on long sessions |
| A-06 | The writing goal (from SPEC-CORE-001 goal prompt) is always available as a string for evaluation prompts | High | Evaluation prompts lack context, producing meaningless results |
| A-07 | Pushback is inherently rare; the evaluation prompt can be tuned to a low false-positive rate | Medium | Frequent false alarms erode user trust and interfere with flow |

---

## 3. Requirements

### 3.1 Pushback Requirements

#### REQ-GUARD-001: Pushback Evaluation After Regeneration (Event-Driven)

**WHEN** the regeneration pipeline completes and returns new text segments, **THEN** the system **shall** send the regenerated output, preserved context, and the current writing goal to the Pushback Evaluator (GPT-4o), which evaluates each segment against three trigger categories: goal contradiction, structural coherence, and quality concern.

**Acceptance:** Pushback evaluation is invoked on every regeneration completion. The evaluation covers all newly generated segments. The three trigger categories are checked in a single API call.

---

#### REQ-GUARD-002: Pushback Warning Display (Event-Driven)

**WHEN** the Pushback Evaluator returns one or more flagged segments, **THEN** the system **shall** apply an orange/warning highlight to each flagged segment in the editor, display a tooltip on hover containing the explanation and trigger category, render "Keep anyway" and "Accept suggestion" buttons within each tooltip, and add corresponding entries to the Pushback Comments section in the side panel.

**Acceptance:** Flagged segments are visually distinct with orange highlight. Tooltips appear on hover with explanation text. Side panel mirrors all active pushback warnings as a persistent list. Multiple flags from one regeneration appear simultaneously.

---

#### REQ-GUARD-003: Pushback User Response -- Keep Anyway (Event-Driven)

**WHEN** the user clicks "Keep anyway" on a pushback warning, **THEN** the system **shall** dismiss the warning (remove orange highlight and tooltip), retain the flagged text unchanged, log the event as `pushback-override` in the provenance store with the segment text, trigger category, and timestamp, and remove the corresponding entry from the Pushback Comments section in the side panel.

**Acceptance:** Warning is dismissed. Text is unchanged. Provenance log contains the override event. Side panel entry is removed.

---

#### REQ-GUARD-004: Pushback User Response -- Accept Suggestion (Event-Driven)

**WHEN** the user clicks "Accept suggestion" on a pushback warning, **THEN** the system **shall** apply the suggested edit to the flagged segment, dismiss the warning (remove orange highlight and tooltip), log the event as `pushback-accepted` in the provenance store with the original text, suggested replacement, trigger category, and timestamp, update the segment's text state to reflect the applied edit, and remove the corresponding entry from the Pushback Comments section in the side panel.

**Acceptance:** Suggested edit is applied inline. Warning is dismissed. Provenance log contains the acceptance event with before/after text. Side panel entry is removed.

---

#### REQ-GUARD-005: Pushback on User-Written Text (State-Driven)

**While** the pushback evaluation is processing segments, **IF** a flagged segment is user-written (not AI-generated), **THEN** the system **shall** apply a higher confidence threshold before displaying the warning, flagging only clear issues (structural breaks, factual contradictions) and never stylistic preferences.

**Acceptance:** User-written segments are flagged only for high-confidence issues. Stylistic concerns on user-written text do not trigger pushback. The evaluation prompt explicitly distinguishes user-written from AI-generated segments.

---

#### REQ-GUARD-006: Pushback Autonomy Guarantee (Unwanted)

The system **shall not** escalate, repeat, or modify its behavior when a user overrides pushback warnings. The system **shall not** increase pushback frequency or severity based on a pattern of user overrides.

**Acceptance:** After a series of "Keep anyway" actions, the system continues to evaluate at the same threshold. No escalation mechanism exists. The user's autonomy is respected unconditionally.

---

### 3.2 Process 2 (Objective Surfacing) Requirements

#### REQ-GUARD-007: Misalignment Detection After Idle (Event-Driven)

**WHEN** a regeneration cycle completes **AND** the user pauses (no active marking, editing, or typing for a configurable idle threshold), **THEN** the system **shall** send the current document state, recent marking history, and current writing goal to the Objective Monitor (GPT-4o), which evaluates whether the user's recent actions diverge from the stated goal.

**Acceptance:** The evaluation triggers only after idle detection. The evaluation prompt includes document state, marking history, and goal. The idle threshold is configurable (default: 5 seconds of inactivity after regeneration completes).

---

#### REQ-GUARD-008: Misalignment Notification Display (Event-Driven)

**WHEN** the Objective Monitor detects misalignment between user actions and stated goal, **THEN** the system **shall** display a notification bar at the bottom of the editor containing a description of the detected misalignment, 2-3 concrete direction options generated by the LLM, and "Apply selected" and "Dismiss" buttons. The notification bar **shall not** block or overlay the editor content.

**Acceptance:** Notification bar appears at the bottom. Editor remains fully interactive. 2-3 direction options are displayed as radio-button selections. Both action buttons are present.

---

#### REQ-GUARD-009: Process 2 Option Selection and Goal Update (Event-Driven)

**WHEN** the user selects a direction option and clicks "Apply selected," **THEN** the system **shall** update the writing goal to reflect the chosen direction, dismiss the notification bar, log the event as `process2-applied` in the provenance store with the old goal, new goal, selected option, and timestamp, and ensure subsequent pushback evaluations and Process 2 checks use the updated goal.

**Acceptance:** The goal updates in the header display and in the side panel Goal section. The notification bar is dismissed. Provenance log contains the goal change event. Future evaluations reference the new goal.

---

#### REQ-GUARD-010: Process 2 Non-Interruption Guarantee (Unwanted)

The system **shall not** display a Process 2 notification while the user is actively marking, editing, or typing in the editor. The notification **shall not** appear during an ongoing regeneration cycle.

**Acceptance:** Notification only appears after regeneration completes AND the idle threshold is met. If the user resumes activity before the notification renders, the notification is suppressed until the next idle window.

---

#### REQ-GUARD-011: Process 2 Deduplication (State-Driven)

**While** a misalignment observation has been previously dismissed by the user, the system **shall not** re-trigger a notification for the same or substantially similar misalignment. The system **shall** store dismissed observations and compare new detections against the dismissed set before displaying.

**Acceptance:** Dismissed observations are stored in the session state. New detections are compared against the dismissed set using semantic similarity. The same misalignment does not re-trigger after dismissal. New, distinct misalignments can still trigger notifications.

---

#### REQ-GUARD-012: Process 2 Vague Goal Handling (Event-Driven)

**WHEN** the Objective Monitor determines that the writing goal is too vague for meaningful misalignment detection, **THEN** the system **shall** include a goal refinement suggestion as one of the 2-3 direction options in the notification bar.

**Acceptance:** Vague goals do not disable Process 2 entirely. At least one option suggests goal refinement. The suggestion includes concrete refinement proposals derived from the document content.

---

## 4. Technical Constraints

| ID   | Constraint                                                                                          |
|------|-----------------------------------------------------------------------------------------------------|
| TC-01 | Pushback evaluation and Process 2 evaluation each require a separate GPT-4o API call                |
| TC-02 | Pushback evaluation must complete before the diff view is finalized (warnings appear alongside the diff) |
| TC-03 | Process 2 evaluation is asynchronous and non-blocking; it does not delay any user interaction        |
| TC-04 | All pushback and Process 2 events must be logged in the provenance store (SPEC-CORE-001)            |
| TC-05 | The idle detection threshold must be configurable via a constant (not hardcoded in UI logic)         |
| TC-06 | Pushback tooltips and Process 2 notification bar must be accessible via keyboard (tab focus)         |
| TC-07 | Orange highlight for pushback must be visually distinct from green (AI-generated), red (deleted), and default text states |
| TC-08 | Process 2 notification bar must not shift editor scroll position when appearing or disappearing      |
| TC-09 | Dismissed Process 2 observations must persist within the session (localStorage) but do not need to persist across sessions |
| TC-10 | The system must gracefully handle GPT-4o API failures for both pushback and Process 2 (silent failure with console logging, no user-facing error for evaluation failures) |

---

## 5. Specifications

### 5.1 Pushback Evaluation Flow

```
Regeneration completes
    |
    v
Pushback Evaluator receives:
  - regenerated segments (with positional metadata)
  - preserved/user-written context
  - current writing goal
    |
    v
GPT-4o evaluates each segment against:
  1. Goal contradiction
  2. Structural coherence
  3. Quality concern
    |
    v
Returns: array of flagged segments, each with:
  - segment identifier (position)
  - trigger category
  - explanation text
  - suggested edit (optional)
    |
    v
For each flagged segment:
  - Apply orange highlight in editor
  - Create tooltip with explanation + buttons
  - Add entry to side panel Pushback Comments
```

### 5.2 Process 2 Evaluation Flow

```
Regeneration cycle completes
    |
    v
Idle detection starts (timer begins)
    |
    v
User becomes idle (no activity for threshold duration)
    |
    v
Check dismissed observations set
    |
    v
Objective Monitor receives:
  - current document state
  - recent marking/editing history
  - current writing goal
  - dismissed observations (for deduplication)
    |
    v
GPT-4o evaluates:
  - Is there misalignment between actions and goal?
  - If yes: generate description + 2-3 direction options
  - If goal is vague: include refinement suggestion
    |
    v
Check: is user still idle?
  - Yes: display notification bar
  - No: suppress, retry on next idle window
```

### 5.3 Data Structures

#### Pushback Flag

```typescript
interface PushbackFlag {
  id: string;
  segmentId: string;
  segmentText: string;
  triggerCategory: 'goal-contradiction' | 'structural-coherence' | 'quality-concern';
  explanation: string;
  suggestedEdit: string | null;
  authorshipType: 'ai-generated' | 'user-written' | 'user-edited';
  status: 'active' | 'overridden' | 'accepted';
  createdAt: number;
  resolvedAt: number | null;
}
```

#### Process 2 Notification

```typescript
interface MisalignmentNotification {
  id: string;
  description: string;
  options: DirectionOption[];
  status: 'active' | 'applied' | 'dismissed';
  createdAt: number;
  resolvedAt: number | null;
}

interface DirectionOption {
  id: string;
  label: string;
  description: string;
  proposedGoalUpdate: string;
}
```

#### Dismissed Observation

```typescript
interface DismissedObservation {
  id: string;
  description: string;
  dismissedAt: number;
  documentStateHash: string;
}
```

### 5.4 Side Panel Integration

The Pushback Comments section in the side panel (defined in SPEC-CORE-001 layout):

- Mirrors all active pushback flags as a persistent list
- Each entry displays the flagged text excerpt, trigger category, and explanation
- Each entry has "Keep anyway" and "Accept suggestion" buttons
- Entries are removed when the corresponding pushback is resolved
- Section header shows count of active flags (e.g., "Pushback Comments (2)")

---

## 6. Traceability

| Requirement    | Design Rationale | Acceptance Criteria           |
|----------------|------------------|-------------------------------|
| REQ-GUARD-001  | DR2, DR3         | AC-GUARD-001, AC-GUARD-002    |
| REQ-GUARD-002  | DR2, DR3         | AC-GUARD-003                  |
| REQ-GUARD-003  | DR2              | AC-GUARD-004                  |
| REQ-GUARD-004  | DR2              | AC-GUARD-005                  |
| REQ-GUARD-005  | DR2, DR3         | AC-GUARD-006                  |
| REQ-GUARD-006  | DR2              | AC-GUARD-007                  |
| REQ-GUARD-007  | DR2, DR5         | AC-GUARD-008                  |
| REQ-GUARD-008  | DR2, DR5         | AC-GUARD-009                  |
| REQ-GUARD-009  | DR2, DR5         | AC-GUARD-010, AC-GUARD-011    |
| REQ-GUARD-010  | DR2              | AC-GUARD-012                  |
| REQ-GUARD-011  | DR2              | AC-GUARD-013                  |
| REQ-GUARD-012  | DR2, DR5         | AC-GUARD-014                  |
