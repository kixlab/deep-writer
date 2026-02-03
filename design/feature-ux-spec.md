# CoWriThink: Feature/UX Specification

Detailed specification of every feature, its states, transitions, and edge cases.

---

## Feature 1: Goal Prompt

### Purpose
Establish a baseline writing goal that anchors all system behavior (pushback, misalignment detection, reliance assessment).

### Behavior

**On session start:**
- Modal appears with a text input: "What are you writing?"
- Placeholder example: "An argumentative essay about whether AI should be used in education. I want to argue yes but with some concerns."
- Required field -- user must enter something before proceeding.
- **Accepts any input**, including vague goals. The system does its best with whatever is provided.

**After goal is set:**
- Two buttons appear: "Start from scratch" / "Generate AI first draft"
- Goal is displayed persistently in the editor header (collapsed, expandable on click)

### Living Goal

The goal is **not static**. It evolves through three mechanisms:

| Mechanism | How it works |
|-----------|-------------|
| **Manual edit** | User clicks the goal in the header and edits it directly at any time |
| **Process 2 update** | When Process 2 detects misalignment and user selects a new direction, the goal updates accordingly |
| **System inference** | System refines its internal understanding of the goal based on user behavior (marking patterns, edits, chat requests). The displayed goal text updates only via manual edit or Process 2 -- but the system's *interpretation* of the goal sharpens over time |

### Edge Cases

- **Vague goal**: System accepts it. Pushback and Process 2 will be less precise, but not disabled. As the user writes and marks, the system infers more specific intent.
- **Goal changes drastically mid-session**: System accepts the new goal. Previous pushback/Process 2 judgments based on the old goal are not retroactively applied.
- **User leaves goal blank and tries to proceed**: Blocked. Modal does not dismiss without text.

---

## Feature 2: Editor + Text States

### Purpose
Rich text editor where all writing and AI interaction happens. Every piece of text has a tracked state.

### Text Segment States

Every segment of text exists in one of these states:

| State | Color | Meaning |
|-------|-------|---------|
| `user-written` | Default (no highlight) | User typed this from scratch |
| `ai-generated` | Green highlight | AI produced this text |
| `ai-pending` | Green highlight (in diff view) | AI suggestion, not yet accepted/rejected |
| `user-edited` | Subtle underline or border | Was AI-generated, user edited in-place |
| `marked-preserve` | Green background | User explicitly chose to keep |
| `marked-delete` | Red strikethrough | User explicitly chose to remove |
| `original-removed` | Red strikethrough (in diff) | Original text that AI proposes to replace |

### Diff Display

When AI generates, both original and replacement are shown inline:

```
  ~~Despite the growing body of literature~~     ← original (red strikethrough)
  → While research has expanded rapidly          ← AI replacement (green highlight)
```

**Diff is always shown.** User must interact with the diff (mark/accept/reject) before it collapses into final text.

### Marking on the Diff View

The diff view IS the marking interface:

| User action on diff | Effect |
|-------------------|--------|
| Click red (removed original) | **Cancel removal**: restore original text, discard AI replacement for that span |
| Click green (AI replacement) | **Reject addition**: discard AI replacement, restore original for that span |
| Click untouched text | **Mark for replacement**: open this span for AI to replace in next generation |
| Double-click any text | **Edit in-place**: cursor appears, user rewrites directly |

### Mixed Selections

When user selects text spanning multiple authorship types (user-written + AI-generated), the entire selection is treated as **one unit**. Toggling applies to the whole selection.

---

## Feature 3: Marking Interaction

### Purpose
The core interaction mechanism. Users mark text to control what AI preserves, replaces, or regenerates.

### Progressive Granularity

Clicking the same region expands the selection scope:

```
Click 1 → word:      "fundamentally"
Click 2 → phrase:    "fundamentally changed how"
Click 3 → sentence:  "fundamentally changed how people approach the writing process."
```

**Visual feedback:** Selected region visually grows with each click. A distinct highlight border shows the current selection scope.

**Boundary detection:**
- Word: whitespace boundaries
- Phrase: split by punctuation (commas, semicolons, colons) and conjunctions (and, but, or, which, that)
- Sentence: split by periods, question marks, exclamation marks

**Reset:** Clicking outside the selection deselects. Next click on the same text starts from word level again.

### Toggle Behavior

- Click on unmarked text → mark as `deleted` (red strikethrough)
- Click on `deleted` text → toggle back to unmarked (cancel deletion)
- Click on `preserved` text → toggle to `deleted`
- Double-click any text → enter edit mode (cursor appears)
- Press Escape or click outside → exit edit mode

### Regeneration Trigger

**Explicit button only.** User clicks "Regenerate" when satisfied with their marks.

```
┌─────────────────────────────────────────────────────────┐
│  ...marked text...                                      │
│                                                         │
│                              [ Regenerate ]             │
└─────────────────────────────────────────────────────────┘
```

The button appears (or becomes active) when at least one segment is marked for deletion.

### What Happens on Regenerate

1. All `marked-delete` segments are sent to AI as gaps to fill
2. All `marked-preserve` and `user-written` segments are sent as constraints
3. The user's goal is included in the generation prompt
4. AI returns new text for the gaps only
5. Result appears as inline diff (original strikethrough + green replacement)
6. Pushback check runs on the result (Feature 4)
7. Provenance store logs all changes

---

## Feature 4: Guarded Compliance (Pushback)

### Purpose
The system evaluates the regenerated result and flags potential issues.

### Timing

Pushback runs **after regeneration**, not before. The flow is:

```
User marks → clicks Regenerate → AI generates → pushback evaluates result → warnings shown
```

### Triggers

Pushback flags a segment when:

| Trigger | Example |
|---------|---------|
| **Goal contradiction** | Regenerated text argues the opposite of the stated goal |
| **Structural coherence** | A key premise was removed and the argument no longer flows |
| **Quality concern** | User preserved AI text that is vague, cliched, or unsupported |

### UI: Inline Warning

Flagged segments get an **orange/warning highlight**. A tooltip appears on hover:

```
  ██ enabling users to produce text at
  ⚠ remarkable speed.                        ← orange highlight
  ┌──────────────────────────────────────────┐
  │ "remarkable speed" is vague. Consider    │
  │ specifying what kind of speed gain.      │
  │                                          │
  │  [ Keep anyway ]  [ Accept suggestion ]  │
  └──────────────────────────────────────────┘
```

### User Response

- **Keep anyway**: warning dismisses, text stays as-is. Logged as "user overrode pushback."
- **Accept suggestion**: system applies its suggested edit. Logged as "user accepted pushback."

### Frequency

Pushback is **inherently rare** -- it only triggers on genuine deviation from goal, structural problems, or quality concerns. If the user's marks are consistent with their goal and the result is coherent, pushback does not appear.

### Edge Cases

- **Multiple flags in one generation**: all appear simultaneously with individual tooltips
- **Pushback on user-written text**: possible (quality concern on user's own text), but system should be more cautious -- flag only clear issues, not stylistic preferences
- **User ignores all warnings**: system does not escalate or change behavior. Respects user autonomy.

---

## Feature 5: Process 2 -- Objective Surfacing

### Purpose
Proactively detect misalignment between user's actions and stated goal, and offer direction options.

### Trigger

System compares the current document state + recent marking history against the user's goal **after each regeneration cycle completes and the user pauses** (no active marking).

Process 2 only fires when genuine misalignment is detected. It is silent when writing is on track.

### UI: Notification Bar

Appears at the bottom of the editor. Does not block the editor.

```
├─────────────────────────────────────────────────────────┤
│ Your recent edits seem to shift toward [direction A]    │
│ but your goal mentions [direction B].                   │
│                                                         │
│  ○ Option 1: [description]                              │
│  ○ Option 2: [description]                              │
│  ○ Option 3: [description]                              │
│                                                         │
│  [ Apply selected ]                        [ Dismiss ]  │
└─────────────────────────────────────────────────────────┘
```

### Options

2-3 concrete direction options generated by the LLM based on the detected misalignment.

### User Response

- **Select + Apply**: goal updates to reflect the chosen direction. Future pushback and Process 2 use the new goal.
- **Dismiss**: notification disappears. System does not re-trigger for the same misalignment unless the user's actions shift further.

### Timing Rule

**Wait for pause only.** Process 2 never interrupts active marking or editing. It appears only:
- After a regeneration cycle completes
- When the user has stopped interacting for a few seconds

### Edge Cases

- **User intentionally changed direction**: they dismiss the notification and optionally update the goal manually.
- **Repeated dismissals**: system does not re-trigger the same observation. It waits for new evidence of misalignment.
- **Goal is too vague for misalignment detection**: Process 2 may suggest goal refinement as one of the options.

---

## Feature 6: Awareness Layer -- Reliance Assessment

### Purpose
Help users understand their reliance patterns across the writing session.

### Two UI Components

**A. Always-on indicator (top-right):**

```
  [ ████░░ 68% ]
```

A small bar showing overall reliance score. Always visible. Higher = more user involvement.

**B. Text-level color overlay (on-demand):**

Click the indicator to toggle the overlay on/off. The text is color-coded by authorship/engagement:

| Color | Meaning |
|-------|---------|
| Warm (orange/red) | High user involvement -- user-written or substantially edited |
| Neutral (yellow) | Medium -- user made meaningful engagement (specific requests, deliberate preservation after review) |
| Cool (blue/gray) | Low user involvement -- AI-generated, accepted quickly with minimal engagement |

### Reliance Assessment Criteria

The reliance score is **LLM-assessed per interaction round** (each marking-regeneration cycle), using the full interaction history as evidence. Not a simple ratio.

**5 Levels:**

| Level | Name | Color | Key signal |
|-------|------|-------|-----------|
| 5 | Writer-driven | Deep warm (dark orange) | Typed from scratch or substantial rewrite |
| 4 | Actively shaped | Warm (orange) | Deliberate preserve/delete/edit mix, directed requests |
| 3 | Selectively engaged | Neutral (yellow) | Some marks, minor edits, moderate dwell time |
| 2 | Superficially engaged | Cool (light blue) | Brief skim, word swaps, vague requests |
| 1 | Minimal engagement | Deep cool (gray) | Near-zero dwell time, no marks, accepted without reading |

**4 assessment dimensions evaluated per round:**

#### Dimension 1: Marking Behavior

| Signal | Level 5 | Level 4 | Level 3 | Level 2 | Level 1 |
|--------|---------|---------|---------|---------|---------|
| Action taken | Substantial rewrite in-place | Mix of preserve, delete, edit | Some marks, minor edits | Few quick word swaps | No marks at all |
| Granularity | Word-level precision across many segments | Phrase-level selective marking | Sentence-level or coarse marking | Scattered word-level changes | N/A |
| Review evidence | Multiple rounds of marking on same segment | Revisited and adjusted marks | Single pass with some attention | Single quick pass | No evidence of review |

#### Dimension 2: Request Quality

| Signal | Level 5 | Level 4 | Level 3 | Level 2 | Level 1 |
|--------|---------|---------|---------|---------|---------|
| Specificity | "Shorten to 2 sentences, keep the metaphor about erosion" | "Make this more concise, focus on the main argument" | "Improve this paragraph" | "Make it better" | "Continue" or no request |
| Goal reference | Request explicitly connects to writing goal | Request shows awareness of direction | Implicit direction | No direction | Absent |
| Constraint setting | Specifies what to preserve AND what to change | Specifies either preserve or change | Loose preference | No constraints | N/A |

#### Dimension 3: Editing Depth

| Signal | Level 5 | Level 4 | Level 3 | Level 2 | Level 1 |
|--------|---------|---------|---------|---------|---------|
| Modification extent | Rewrote sentence structure, changed argument flow | Rephrased clauses, cut redundancy | Minor rephrase of a clause | Word swaps, punctuation only | No edits |
| Pushback response | Accepted AND further refined the suggestion | Thoughtfully accepted or rejected | Quick accept/reject | Instant "Keep anyway" | Ignored or didn't see |
| Post-generation edit | Edited AI output substantially after accepting | Made targeted edits on AI output | Minor touch-up | No change after accepting | No interaction |

#### Dimension 4: Temporal Patterns

| Signal | Level 5 | Level 4 | Level 3 | Level 2 | Level 1 |
|--------|---------|---------|---------|---------|---------|
| Dwell time | Extended engagement, deliberate pace | Meaningful pause before decisions | Moderate pause, then action | Brief skim | Near-zero dwell time |
| Consistency | Deeply engaged throughout the round | Engaged with occasional quick decisions | Mixed -- some attention, some auto-pilot | Mostly quick, occasional pause | Uniformly instant |
| Return visits | Came back to revise earlier marked segments | Revisited at least once | Linear pass, no revisiting | Linear, fast | N/A |

#### Synthesis

The LLM considers all four dimensions holistically. The final level is **not an average** -- it reflects the overall character of the round. Rules:
- If any dimension is Level 5, the round is at least Level 4
- If all dimensions are Level 1, the round is Level 1
- Mixed dimensions: LLM weighs the most informative signals for that round

**Full rubric with examples, LLM prompt template, and UI mapping:** see `notes/reliance-assessment-criteria.md`

**When it runs:**
- The always-on indicator updates after each regeneration cycle
- The detailed color overlay runs the full LLM assessment on-demand when the user toggles it on

### Edge Cases

- **Very short session**: limited data for assessment. System shows scores with lower confidence / neutral colors.
- **User never toggles overlay**: that's fine. The always-on indicator provides passive awareness.
- **User disagrees with the score**: no mechanism to dispute in v1. Log this as a study finding.

---

## Feature 7: Provenance Store

### Purpose
Track the full authoring history for awareness layer, study data export, and session persistence.

### What is Logged

Every interaction is logged with a timestamp:

| Event | Data recorded |
|-------|--------------|
| Text typed | Position, content, timestamp |
| AI generation requested | Prompt/request text, selected region, goal at time of request |
| AI text received | Generated content, position |
| Mark applied | Segment, action (preserve/delete), granularity level |
| Edit in-place | Original text, new text, position |
| Pushback shown | Flagged segment, trigger type, explanation |
| Pushback response | User choice (keep/accept), timestamp |
| Process 2 shown | Misalignment description, options offered |
| Process 2 response | User choice (option selected / dismiss) |
| Awareness toggled | On/off, timestamp |
| Goal changed | Old goal, new goal, change source (manual/Process 2/inferred) |

### Storage

**localStorage** for the prototype. Data persists across browser sessions on the same device.

### Export

"Export Session" button: downloads the full provenance log + final document state + session metadata as a JSON file. Used for study analysis.

### Data Model

```
Session {
  id: string
  goal: string (current)
  goalHistory: GoalChange[]
  documentState: string (current document content)
  provenanceLog: ProvenanceEvent[]
  relianceScores: SegmentScore[] (latest assessment)
  createdAt: timestamp
  lastModifiedAt: timestamp
}

ProvenanceEvent {
  id: string
  type: EventType
  timestamp: number
  data: object (varies by event type)
}

SegmentScore {
  spanStart: number
  spanEnd: number
  text: string
  score: number (0-100)
  authorship: 'user' | 'ai' | 'negotiated'
  justification: string
}
```

---

## Feature 8: AI Request Prompt Bar

### Purpose
The interface for users to type natural language requests to AI.

### Location
**Bottom of editor, always visible.** Persistent input bar similar to a chat input.

```
┌─────────────────────────────────────────────────────────┐
│  CoWriThink    Goal: "An argumenta..." ▼  [ ███░░ 58%] │
│─────────────────────────────────────────────────────────│
│                                                         │
│  ...editor text...                                      │
│                                                         │
│─────────────────────────────────────────────────────────│
│  ┌───────────────────────────────────────────┐          │
│  │ "Shorten this paragraph, keep the main    │ [  ▶  ]  │
│  │  claim"                                   │          │
│  └───────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### Two Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **With selection** | User selects text, then types in prompt bar | AI generates for the selected region, respecting the request |
| **Without selection** | User places cursor and types in prompt bar | AI continues writing at the cursor position based on the request |

### Behavior
- Pressing Enter or clicking the send button submits the request
- The request text is logged in provenance (request quality is an assessment dimension)
- While AI generates, the prompt bar shows a subtle loading indicator
- Previous requests are NOT shown as chat history (this is a writing tool, not a chat interface)

---

## Feature 9: Overall Layout

### Purpose
Spatial arrangement of all UI components.

### Layout: Editor (70%) + Side Panel (30%)

```
┌─────────────────────────────────────────────────────────────────┐
│  CoWriThink                                    [ ████░░ 68% ]  │
│─────────────────────────────────────────────────────────────────│
│                                    │                            │
│                                    │  GOAL                      │
│                                    │  ┌──────────────────────┐  │
│                                    │  │ "An argumentative    │  │
│        EDITOR                      │  │ essay about whether  │  │
│                                    │  │ AI should be used in │  │
│  Text with marking,                │  │ education..."  [edit] │  │
│  diff view, and                    │  └──────────────────────┘  │
│  awareness overlay                 │                            │
│  happens here.                     │  PUSHBACK COMMENTS         │
│                                    │  ┌──────────────────────┐  │
│                                    │  │ ⚠ "remarkable speed" │  │
│                                    │  │ is vague. Consider   │  │
│                                    │  │ specifying...        │  │
│                                    │  │ [Keep] [Accept]      │  │
│                                    │  └──────────────────────┘  │
│                                    │                            │
│                                    │  ROUND HISTORY             │
│                                    │  ┌──────────────────────┐  │
│                                    │  │ Round 3 ●●●○○ Lv3   │  │
│                                    │  │ Round 2 ●●●●○ Lv4   │  │
│                                    │  │ Round 1 ●●○○○ Lv2   │  │
│                                    │  └──────────────────────┘  │
│                                    │                            │
│                                    │  DOCUMENT OUTLINE          │
│                                    │  ┌──────────────────────┐  │
│                                    │  │ ¶1: Opening argument │  │
│                                    │  │ ¶2: AI benefits      │  │
│                                    │  │ ¶3: Concerns         │  │
│                                    │  │ ¶4: Conclusion       │  │
│                                    │  └──────────────────────┘  │
│                                    │                            │
│─────────────────────────────────────────────────────────────────│
│  ┌─────────────────────────────────────────────┐                │
│  │ Type AI request here...                     │  [  ▶  ]      │
│  └─────────────────────────────────────────────┘                │
├─────────────────────────────────────────────────────────────────┤
│  Process 2 notification bar (appears here when triggered)       │
└─────────────────────────────────────────────────────────────────┘
```

### Side Panel Sections

| Section | Content | Behavior |
|---------|---------|----------|
| **Goal** | Current writing goal, editable. Click [edit] to modify. | Always visible at top of panel |
| **Pushback Comments** | Active pushback warnings from the current round. Each with Keep/Accept buttons. | Appears when pushback triggers. Mirrors the inline tooltips but provides a persistent list. Clears when resolved. |
| **Round History** | Chronological list of past marking-regeneration rounds. Each shows round number + reliance level (1-5 dots). | Always visible. Click a round to see detail (which segments were marked, what was generated). |
| **Document Outline** | Auto-generated paragraph summaries. | Always visible. Click a paragraph to scroll to it in the editor. |

### Side Panel Collapsible

User can collapse the side panel to give full width to the editor. A toggle button at the panel edge expands/collapses.

---

## Feature 10: Loading States

### Purpose
Visual feedback during AI generation and assessment.

### During AI Generation (after clicking Regenerate or submitting prompt)

**Skeleton placeholder** in the editor where AI text will appear:

```
  ██ User's preserved text stays visible.
  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← pulsing gray
  │  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░      │    placeholder
  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
  ██ More preserved text below.
```

- Regenerate button shows a spinner and is disabled
- Prompt bar shows a subtle progress indicator
- Editor is **read-only** during generation (no marking or editing)
- Side panel remains interactive (user can read goal, review history)

### During Pushback Check (runs after generation completes)

- No separate loading state -- pushback warnings appear as they arrive
- If pushback check takes time, diff appears first and warnings pop in after

### During Reliance Assessment (when user toggles overlay)

- Brief loading indicator on the reliance bar: `[ ░░░░░ ... ]`
- Overlay colors appear once assessment completes
- If fast enough (<1s), no visible loading state

---

## Feature 11: Keyboard Shortcuts

**Mouse-only for the prototype.** All interactions via click, double-click, and the prompt bar.

Keyboard shortcuts will be added post-study based on participant feedback about what interactions feel slow or repetitive.

---

## Interaction State Machine

### Document-Level States

```
[Goal Setting] → [Writing] ⇄ [Marking] → [Regenerating] → [Reviewing Diff]
                     ↑              ↑                            │
                     │              └────────────────────────────┘
                     │                    (loop)
                     │
                [Awareness View] (toggle, overlays on any state)
```

### Per-Segment State Transitions

```
                    ┌──────────┐
         typed  →   │  user-   │
                    │  written │
                    └────┬─────┘
                         │ click (mark for AI)
                         ▼
                    ┌──────────┐
                    │  marked- │
                    │  delete  │ ←──── click (toggle)
                    └────┬─────┘
                         │ regenerate
                         ▼
               ┌──────────────────┐
               │   diff view:     │
               │   red (original) │
               │   green (AI new) │
               └────┬────────┬────┘
          click red │        │ click green
          (restore) │        │ (reject AI)
                    ▼        ▼
              ┌────────┐  ┌────────┐
              │preserved│  │original│
              │(user    │  │restored│
              │decided) │  │        │
              └────────┘  └────────┘

  Double-click at any state → edit mode → becomes 'user-edited'
```

---

## Summary of All Design Decisions

| # | Feature | Decision |
|---|---------|----------|
| 1 | Goal | Accepts any input, evolves via manual edit + Process 2 + system inference |
| 2 | Goal mid-session | Both manual edit and Process 2 can update |
| 3 | Diff display | Always show diff (original + AI). No auto-replace. |
| 4 | Mixed selection | Treated as one unit |
| 5 | Marking on diff | Click red = cancel removal, click green = reject AI, click untouched = mark for replacement |
| 6 | Progressive granularity | Word → phrase → sentence, highlight expansion feedback |
| 7 | Toggle | Click to mark delete, click again to restore. Double-click to edit. |
| 8 | Regeneration trigger | Explicit button only |
| 9 | Default state of AI text | Diff view requires explicit interaction before accepting |
| 10 | Pushback timing | After regeneration, on the result |
| 11 | Pushback triggers | Goal contradiction + structural coherence + quality concern |
| 12 | Pushback frequency | Inherently rare, fires only on genuine issues |
| 13 | User overrides pushback | System does not change behavior. Respects autonomy. |
| 14 | Process 2 options | 2-3 concrete directions |
| 15 | Process 2 timing | Wait for pause only, never interrupts |
| 16 | Reliance score | LLM-assessed qualitative evaluation, not simple ratio |
| 17 | Assessment dimensions | Marking behavior + request quality + editing depth + temporal patterns |
| 18 | Color scheme | Warm-cool spectrum (warm = high involvement, cool = low) |
| 19 | Awareness visibility | Always-on indicator + detailed overlay on-demand |
| 20 | Storage | localStorage + JSON export |
| 21 | Prompt bar | Bottom of editor, always visible. Works with or without text selection |
| 22 | Layout | Editor (70%) + collapsible side panel (30%) |
| 23 | Side panel content | Goal (editable) + pushback comments + round history + document outline |
| 24 | Loading state | Skeleton placeholder in editor during AI generation |
| 25 | Keyboard shortcuts | Mouse only for prototype. Shortcuts added post-study |

---

## Appendix A: Design Rationale Mapping

Every feature traces back to the design requirements (DR1-DR5). If a feature doesn't map to any DR, it shouldn't exist.

### DR → Feature Matrix

| | DR1: Reliance awareness | DR2: Collaborative AI | DR3: Reflective space | DR4: Fine-grained control | DR5: Low-effort intent |
|---|:---:|:---:|:---:|:---:|:---:|
| **Goal Prompt** | | ● | | | ● |
| **Diff Display** | ● | | ● | ● | |
| **Marking (Process 1)** | ● | | ● | ● | ● |
| **Pushback** | | ● | ● | | |
| **Process 2** | | ● | | | ● |
| **Awareness Overlay** | ● | | ● | | |
| **Reliance Indicator** | ● | | | | |
| **Provenance Store** | ● | | | | |

### Feature-by-Feature Rationale

**Goal Prompt**
- DR2: establishes the basis for collaborative negotiation (system needs a goal to push back against)
- DR5: user sets direction once, system handles the rest

**Diff Display (always-show)**
- DR1: seeing both original and AI text side-by-side makes the AI's contribution transparent
- DR3: forcing the user to interact with the diff (not auto-accept) creates a reflective moment
- DR4: the diff view is where fine-grained marking happens

**Marking Interaction**
- DR1: marking patterns generate the data for reliance assessment
- DR3: editing in-place (double-click) is a knowledge-transforming act -- user rewrites rather than delegates
- DR4: word → phrase → sentence granularity gives precise control
- DR5: click-to-toggle is lower effort than articulating intent in words

**Guarded Compliance (Pushback)**
- DR2: the system acts as a collaborator, not a servant -- it can disagree
- DR3: pushback interrupts autopilot acceptance, creating a reflective pause

**Process 2 (Objective Surfacing)**
- DR2: system proactively proposes directions rather than waiting for the user to articulate
- DR5: user selects from 2-3 options rather than formulating goals from scratch

**Awareness Overlay**
- DR1: direct visualization of reliance patterns across the text
- DR3: seeing cool/gray regions prompts reflection on whether the user should engage more deeply

**Reliance Indicator**
- DR1: persistent ambient awareness of overall reliance level

**Provenance Store**
- DR1: provides the underlying data for all awareness features

---

## Appendix B: User Flow Diagrams

### Flow 1: Complete Writing Session

```
┌──────────────┐
│  Open App    │
└──────┬───────┘
       ▼
┌──────────────┐
│  Enter Goal  │ (required)
└──────┬───────┘
       ▼
   ┌───────┐
   │ Start │──── "From scratch" ───→ ┌─────────────────┐
   │ Mode? │                         │  Empty Editor    │
   └───┬───┘                         │  User types      │
       │                             └────────┬────────┘
       └──── "AI first draft" ──→ ┌───────────┴──────────┐
                                  │  AI generates draft   │
                                  │  Diff view appears    │
                                  └───────────┬──────────┘
                                              ▼
                                  ┌──────────────────────┐
                              ┌──→│  MARKING LOOP        │
                              │   │                      │
                              │   │  User reads text     │
                              │   │  Clicks to mark      │
                              │   │  (preserve/delete/   │
                              │   │   edit in-place)     │
                              │   └──────────┬───────────┘
                              │              ▼
                              │   ┌──────────────────────┐
                              │   │  User clicks         │
                              │   │  [ Regenerate ]      │
                              │   └──────────┬───────────┘
                              │              ▼
                              │   ┌──────────────────────┐
                              │   │  AI generates in     │
                              │   │  deleted gaps         │
                              │   │  Diff appears         │
                              │   └──────────┬───────────┘
                              │              ▼
                              │   ┌──────────────────────┐
                              │   │  PUSHBACK CHECK      │
                              │   │                      │
                              │   │  Any issues?         │
                              │   └────┬─────────┬───────┘
                              │    No  │         │ Yes
                              │        ▼         ▼
                              │   ┌─────────┐ ┌────────────────┐
                              │   │ Review  │ │ Show warnings  │
                              │   │ diff    │ │ User resolves  │
                              │   └────┬────┘ │ (keep/accept)  │
                              │        │      └───────┬────────┘
                              │        ▼              │
                              │   ┌───────────┐       │
                              │   │ Satisfied?│◄──────┘
                              │   └──┬────┬───┘
                              │  No  │    │ Yes
                              └──────┘    ▼
                                   ┌──────────────┐
                        ┌─────────→│  PROCESS 2   │
                        │          │  CHECK       │
                        │          │              │
                        │          │ Misaligned?  │
                        │          └──┬───────┬───┘
                        │         No  │       │ Yes
                        │             ▼       ▼
                        │       ┌─────────┐ ┌────────────────┐
                        │       │Continue │ │ Show options   │
                        │       │writing  │ │ User selects   │
                        │       └─────────┘ │ or dismisses   │
                        │                   └───────┬────────┘
                        │                           │
                        └───────────────────────────┘

  At ANY point: user can toggle [Awareness] overlay
  At ANY point: user can edit goal manually
  At ANY point: user can save and exit
```

### Flow 2: Single Marking Interaction (Zoomed In)

```
User sees text
       │
       ▼
  Click on word ──→ word highlighted (selection level: word)
       │
       │ same region?
       ├── Yes: click again ──→ expands to phrase
       │         │
       │         ├── Yes: click again ──→ expands to sentence
       │         │
       │         └── No (click elsewhere) ──→ deselect, new selection starts
       │
       └── No (click elsewhere) ──→ deselect, new selection starts

  At current selection level:
       │
       ├── Single click ──→ toggle preserve ↔ delete
       │
       ├── Double click ──→ enter edit mode
       │                        │
       │                        ├── User types new text
       │                        │
       │                        └── Escape / click outside ──→ exit edit mode
       │                                                       segment = 'user-edited'
       │
       └── Click outside ──→ deselect
```

### Flow 3: Pushback Resolution

```
  Pushback warning appears on segment
       │
       ▼
  ┌─────────────────────┐
  │ Orange highlight +  │
  │ tooltip with        │
  │ explanation         │
  └──────┬──────────────┘
         │
    ┌────┴────┐
    ▼         ▼
[ Keep    [ Accept
  anyway ]  suggestion ]
    │         │
    ▼         ▼
  Warning   System applies
  dismisses suggested edit
  text      segment becomes
  unchanged 'system-suggested'
    │         │
    └────┬────┘
         ▼
  Continue reviewing
```

---

## Appendix C: Screen-by-Screen Mockups

### Screen 1: Goal Prompt (Session Start)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                      CoWriThink                         │
│                                                         │
│  What are you writing?                                  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │                                                   │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│  e.g., "A research paper introduction arguing that      │
│  AI writing tools reduce cognitive engagement"          │
│                                                         │
│                                       [ Start Writing ] │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Screen 2: Start Mode Selection

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                      CoWriThink                         │
│                                                         │
│  Goal: "An argumentative essay about whether AI         │
│  should be used in education. Yes but with concerns."   │
│                                                         │
│                                                         │
│       ┌────────────────┐  ┌─────────────────────┐      │
│       │ Start from     │  │ Generate AI         │      │
│       │ scratch        │  │ first draft         │      │
│       └────────────────┘  └─────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Screen 3: Editor -- Writing Mode (No AI Yet)

```
┌─────────────────────────────────────────────────────────┐
│  CoWriThink    Goal: "An argumenta..." ▼  [ ░░░░░ -- ] │
│─────────────────────────────────────────────────────────│
│                                                         │
│  AI is everywhere in schools now, but is that a         │
│  good thing? On one hand, tools like ChatGPT can        │
│  help students brainstorm ideas and overcome writer's   │
│  block. On the other hand, |                            │
│                            ↑ cursor                     │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│─────────────────────────────────────────────────────────│
│  [ Select text + Generate ]                [ Export ]   │
└─────────────────────────────────────────────────────────┘

  Reliance indicator shows "--" (no AI interaction yet)
```

### Screen 4: Editor -- Diff View After AI Generation

```
┌─────────────────────────────────────────────────────────┐
│  CoWriThink    Goal: "An argumenta..." ▼  [ ███░░ 58%] │
│─────────────────────────────────────────────────────────│
│                                                         │
│  AI is everywhere in schools now, but is that a         │
│  good thing? On one hand, tools like ChatGPT can        │
│  help students brainstorm ideas and overcome writer's   │
│  block. On the other hand,                              │
│  ~~there are concerns about students becoming~~         │
│  ~~too dependent on AI for their writing.~~             │
│  → the increasing reliance on AI-generated text         │
│  → raises fundamental questions about whether           │
│  → students are developing critical thinking skills     │
│  → or merely outsourcing their cognition.               │
│                                                         │
│─────────────────────────────────────────────────────────│
│  ~~ ~~ = your original (click to restore)               │
│  →     = AI suggestion (click to reject)                │
│              [ Regenerate ]                 [ Export ]   │
└─────────────────────────────────────────────────────────┘
```

### Screen 5: Editor -- Marking in Progress

```
┌─────────────────────────────────────────────────────────┐
│  CoWriThink    Goal: "An argumenta..." ▼  [ ███░░ 58%] │
│─────────────────────────────────────────────────────────│
│                                                         │
│  AI is everywhere in schools now, but is that a         │
│  good thing? On one hand, tools like ChatGPT can        │
│  help students brainstorm ideas and overcome writer's   │
│  block. On the other hand,                              │
│  ~~there are concerns about students becoming~~  [kept] │
│  ~~too dependent on AI for their writing.~~      [kept] │
│  → the increasing reliance on AI-generated text  [    ] │
│  → raises ░░fundamental░░ questions about whether[    ] │
│  → students are developing critical thinking     [    ] │
│  → skills or merely ░░outsourcing their░░        [    ] │
│  → ░░cognition.░░                                [    ] │
│                                                         │
│─────────────────────────────────────────────────────────│
│  ░░ = marked for deletion (click to undo)               │
│  [kept] = user restored original                        │
│              [ Regenerate ]                 [ Export ]   │
└─────────────────────────────────────────────────────────┘

  User has:
  - Clicked red text to restore their original (lines 1-2)
  - Clicked "fundamental", "outsourcing their", "cognition"
    in AI text to reject those words
```

### Screen 6: Pushback Warning

```
┌─────────────────────────────────────────────────────────┐
│  CoWriThink    Goal: "An argumenta..." ▼  [ ███░░ 58%] │
│─────────────────────────────────────────────────────────│
│                                                         │
│  ...block. On the other hand, there are concerns about  │
│  students becoming too dependent on AI for their        │
│  writing. The increasing reliance on AI-generated text  │
│  raises ⚠ important questions about whether students ⚠  │
│  are developing critical thinking skills.               │
│  ┌─────────────────────────────────────────────────┐    │
│  │ "important questions" is vague -- your original  │    │
│  │ "fundamental questions" was stronger and more     │    │
│  │ specific to your argument.                        │    │
│  │                                                   │    │
│  │  [ Keep anyway ]       [ Restore "fundamental" ]  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│─────────────────────────────────────────────────────────│
│              [ Regenerate ]                 [ Export ]   │
└─────────────────────────────────────────────────────────┘
```

### Screen 7: Process 2 Notification

```
┌─────────────────────────────────────────────────────────┐
│  CoWriThink    Goal: "An argumenta..." ▼  [ ██░░░ 42%] │
│─────────────────────────────────────────────────────────│
│                                                         │
│  ...three paragraphs of text, all arguing strongly      │
│  in favor of AI in education...                         │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Your essay so far argues entirely in favor of AI, but   │
│ your goal mentioned "with some concerns."               │
│                                                         │
│  ○ Add a paragraph addressing concerns about AI         │
│  ○ Reframe: AI is beneficial BUT needs safeguards       │
│  ○ Update goal: remove the "concerns" angle             │
│                                                         │
│  [ Apply selected ]                        [ Dismiss ]  │
└─────────────────────────────────────────────────────────┘
```

### Screen 8: Awareness Overlay Active

```
┌─────────────────────────────────────────────────────────┐
│  CoWriThink    Goal: "An argumenta..." ▼  [▓███░░ 58%] │
│─────────────────────────────────────────────────────────│
│                                                         │
│  ████ AI is everywhere in schools now, but is that a    │
│  ████ good thing? On one hand, tools like ChatGPT can   │
│  ████ help students brainstorm ideas and overcome       │
│  ████ writer's block. On the other hand,                │
│  ░░░░ there are concerns about students becoming        │
│  ░░░░ too dependent on AI for their writing.            │
│  ▓▓▓▓ The increasing reliance on AI-generated text      │
│  ▓▓▓▓ raises fundamental questions about whether        │
│  ░░░░ students are developing critical thinking         │
│  ░░░░ skills or merely outsourcing their cognition.     │
│                                                         │
│─────────────────────────────────────────────────────────│
│  ████ = high involvement (warm)  You wrote / rewrote    │
│  ▓▓▓▓ = medium (neutral)        You engaged with AI    │
│  ░░░░ = low (cool)              AI text, minimal edit   │
│                        [ Close overlay ]   [ Export ]   │
└─────────────────────────────────────────────────────────┘
```

---

## Appendix D: Edge Case Scenarios

### E1: User accepts everything without marking

**Situation:** User generates AI text, clicks nothing, clicks Regenerate again to get more text.

**System response:**
- Regenerate button is disabled if no marks have been made (nothing to regenerate)
- If user has only been generating without marking, the awareness indicator drops toward 0%
- No forced intervention -- the system respects user choice, but the awareness layer makes the pattern visible

### E2: User marks everything for deletion

**Situation:** User deletes all AI text and all their own text.

**System response:**
- AI generates entirely new text from scratch based on the goal
- Essentially equivalent to "Generate AI first draft" again
- Provenance log records the full wipe

### E3: Vague goal, Process 2 can't detect misalignment

**Situation:** User's goal is "Write something about technology."

**System response:**
- Process 2 can offer goal refinement as one of its options: "Your goal is broad. Would you like to narrow it to [option A], [option B], or [option C]?"
- Pushback triggers are weakened but not disabled -- structural coherence and quality checks still work regardless of goal specificity

### E4: User's goal changes dramatically mid-session

**Situation:** User started with "argue for AI in education" but after three paragraphs manually changes goal to "argue against AI in education."

**System response:**
- System accepts the new goal immediately
- Process 2 may fire once: "Your existing text argues for AI but your new goal argues against. Options: (a) Keep existing and add counterpoint, (b) Rewrite from scratch, (c) Reframe as balanced"
- Pushback recalibrates to the new goal
- Reliance scores are not retroactively recalculated -- they reflect engagement at the time of writing

### E5: Pushback is wrong

**Situation:** System flags text as "contradicts your goal" but the user intentionally wrote it as a rhetorical counterargument.

**System response:**
- User clicks "Keep anyway." No further action.
- System does not learn from this override (v1) -- it may flag similar patterns again
- Study interview will capture whether false-positive pushback erodes trust

### E6: User edits in the middle of a diff

**Situation:** Diff view is showing red/green, and user double-clicks to edit something that's part of the diff.

**System response:**
- Edit mode activates on the clicked segment
- If user edits within a green (AI) segment, the edited portion becomes 'user-edited' (purple in awareness)
- If user edits within red (original), it becomes a new user-written segment and the corresponding AI replacement is discarded
- Remaining diff segments stay as they are

### E7: Multiple AI generations without resolving previous diff

**Situation:** User triggers generation, sees diff, then without resolving it, selects different text and triggers generation again.

**System response:**
- First diff remains in place (unresolved)
- Second generation creates a new diff in the newly selected area
- Multiple unresolved diffs can coexist
- User resolves each independently

### E8: Very long document

**Situation:** Document grows to 3000+ words over a session.

**System response:**
- Marking and diff work on whatever section is visible/selected -- no need to process the whole document
- Awareness overlay colors the full document but assessment runs only on segments that have had AI interaction
- Provenance log may become large -- export still works, but localStorage has limits (~5-10MB). Show a warning if approaching limit.

### E9: User only uses "Start from scratch" and never requests AI

**Situation:** User types everything themselves and never triggers AI generation.

**System response:**
- Reliance indicator stays at 100% (full user involvement)
- No diffs, no marking, no pushback, no Process 2
- Awareness overlay shows all-warm (everything is user-written)
- The system effectively becomes a plain text editor -- and that's fine

### E10: Network failure during AI generation

**Situation:** User clicks Regenerate but the API call fails.

**System response:**
- Show a non-blocking error message: "Generation failed. Please try again."
- All marks remain in place -- nothing is lost
- User can retry or continue editing manually
