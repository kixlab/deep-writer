# CoWriThink: Full System Walkthrough

A user scenario from opening the editor to finishing a writing session, covering all components.

---

## Phase 1: Session Start

The user opens CoWriThink. Before accessing the editor, the system requires a **writing goal**.

**Goal prompt (required):**

```
┌─────────────────────────────────────────────────────────┐
│  CoWriThink                                           │
│                                                         │
│  What are you writing?                                  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ e.g., "A research paper introduction arguing      │  │
│  │ that AI writing tools reduce cognitive engagement"│  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                                       [ Start Writing ] │
└─────────────────────────────────────────────────────────┘
```

This goal serves as the **baseline** for:
- Process 1: guarded compliance checks marks against this goal
- Process 2: misalignment detection compares user actions against this goal

**After goal is set, user chooses how to begin:**

```
┌─────────────────────────────────────────────────────────┐
│  CoWriThink                              [Awareness]  │
│                                                         │
│  Goal: "A research paper introduction arguing that      │
│  AI writing tools reduce cognitive engagement"          │
│                                                         │
│  ┌────────────────────┐  ┌─────────────────────────┐   │
│  │  Start from scratch │  │  Generate AI first draft │   │
│  └────────────────────┘  └─────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- **Start from scratch**: empty editor, user types freely
- **Generate AI first draft**: AI produces initial text based on the goal, user enters Process 1 (marking) immediately

---

## Phase 2: User Writes / AI Generates First Draft

**Path A -- User writes from scratch:**

The user types their own text. This text is marked as user-authored in the provenance layer. The user can request AI assistance at any point (Phase 3).

**Path B -- AI generates first draft:**

AI produces text based on the goal. All segments are marked as AI-generated. The user enters Process 1 immediately -- reviewing and marking the AI draft before continuing.

---

## Phase 3: User Requests AI Assistance

Three ways AI assistance can be triggered:

**A. Select + trigger (user-initiated, targeted):**

```
  The rapid growth of AI writing tools has
  [fundamentally changed how people         ]  ← user selects
  approach the writing process.

         ┌──────────────────┐
         │  Generate here   │  ← trigger button / shortcut
         └──────────────────┘
```

User selects a region (or places cursor at a gap) and triggers AI generation for that specific area.

**B. Prompt-based request (user-initiated, directed):**

```
┌─────────────────────────────────────────────────────────┐
│  ...the writing process.                                │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ "Add a counterargument to this paragraph"         │  │
│  └───────────────────────────────────────────────────┘  │
│                                            [ Generate ] │
└─────────────────────────────────────────────────────────┘
```

User types a natural language request in a prompt bar.

**C. System offers help (system-initiated -- overlaps with Process 2):**

The system detects a pause, gap, or potential improvement opportunity and proactively offers assistance. The user can accept or dismiss. (Detailed in Phase 7.)

---

## Phase 4: AI Generates -- Process 1 Begins

AI output appears **inline with diff highlighting**.

**Post-generation state:**

```
  The rapid growth of AI writing tools has
  ~~changed the way writers work~~ → fundamentally changed how
  people approach the writing process, ~~making it~~ →
  enabling users to produce text at unprecedented speed.

  ~~ ~~ = original text (red strikethrough)
     →   = AI replacement (green highlight)
```

All AI-generated segments default to **preserved**. The user reviews and marks.

**Marking interaction -- progressive granularity:**

```
  Click 1 on "fundamentally":   word selected
  ├── toggle: preserve ↔ delete at word level
  │
  Click 2 (same region):        expands to phrase
  │   "fundamentally changed how"
  ├── toggle: preserve ↔ delete at phrase level
  │
  Click 3 (same region):        expands to sentence
  │   "fundamentally changed how people approach the writing process,"
  └── toggle: preserve ↔ delete at sentence level
```

- **Click** = select at current granularity + toggle preserve/delete
- **Click again on same selection** = expand scope (word → phrase → sentence)
- **Double-click** = edit in-place (cursor appears, user rewrites directly)

**Example -- user deletes a word, preserves the rest:**

```
  ...has ██ fundamentally ██ changed ██ how ██ people
  ██ approach ██ the ██ writing ██ process,
  ██ enabling ██ users ██ to ██ produce ██ text ██ at
  ░░ unprecedented ██ speed.

  ██ = preserve (green)    ░░ = delete (red)
```

The user has marked "unprecedented" for deletion. When AI regenerates, it will replace that word while respecting all preserved segments.

---

## Phase 5: Guarded Compliance -- System Pushback

After the user marks segments, the system evaluates the marks before regenerating. If a mark is problematic, the system **does not silently comply** -- it highlights the conflict and explains.

**Refusal UI -- inline highlight + tooltip:**

```
  ...has fundamentally changed how people
  ░░ approach the writing process,          ← user marked delete
  ⚠━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┊ This phrase is the main clause of your  ┊
  ┊ opening argument. Deleting it would     ┊
  ┊ break the paragraph's logical flow.     ┊
  ┊                                         ┊
  ┊  [ Keep anyway ]  [ Accept suggestion ] ┊
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ██ enabling users to produce text at
  ██ remarkable speed.
```

The conflicting segment gets an **orange/warning highlight**. Hovering (or tapping) shows the explanation. The user can **override** (keep their mark) or **accept the suggestion**.

**Three triggers for system pushback:**

| Trigger | Example |
|---------|---------|
| **Goal contradiction** | User preserves a paragraph that argues the opposite of their stated goal |
| **Structural coherence** | User deletes a key premise that the rest of the argument depends on |
| **Quality concern** | User preserves AI-generated text that contains vague claims, weak phrasing, or factual issues |

The system is a **collaborator, not a gatekeeper** -- it explains its reasoning and the user always has the final say.

---

## Phase 6: AI Regenerates -- Loop Continues

After the user finalizes their marks (and resolves any pushback from Phase 5), the system regenerates.

**Regeneration rules:**
- **Preserved segments** (green): locked in place, AI cannot modify
- **Deleted segments** (red): removed, AI fills the gap
- **Edited segments** (user-rewritten): locked in place as user-authored
- AI generates **only** in the gaps left by deletions, respecting all constraints

**Post-regeneration:**

```
  The rapid growth of AI writing tools has
  ██ fundamentally changed how people
  ██ approach the writing process,
  ██ enabling users to produce text at
  ██ remarkable speed.                      ← AI replaced "unprecedented"
     ↑ new AI text (green highlight)

  → User reviews again → marks again → loop continues
```

The cycle repeats until the user is satisfied. Each round of marking feeds data into the awareness layer (Phase 8).

---

## Phase 7: Process 2 -- System Surfaces Objectives

Separately from Process 1, the system monitors for **misalignment between the user's actions and their stated goal**. When detected, it surfaces high-level options via a notification bar.

**Trigger:** The system detects that the user's marks, edits, or writing direction diverge from the stated goal -- or that contradictions are emerging across paragraphs.

**Notification bar (top or bottom of editor):**

```
┌─────────────────────────────────────────────────────────┐
│  ...text in the editor...                               │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ⚡ Your recent edits seem to shift toward "AI benefits" │
│    but your goal is about "reduced cognitive            │
│    engagement." Want to adjust direction?                │
│                                                         │
│  [ Adjust goal ]  [ See options ]  [ Dismiss ]          │
└─────────────────────────────────────────────────────────┘
```

**If user clicks "See options":**

```
├─────────────────────────────────────────────────────────┤
│ ⚡ Suggested directions:                                │
│                                                         │
│  ○ Reframe: argue AI has benefits BUT reduces           │
│    cognitive engagement (nuanced position)              │
│                                                         │
│  ○ Refocus: return to the original argument about       │
│    reduced engagement, remove the benefits section      │
│                                                         │
│  ○ Expand goal: broaden to cover both benefits and      │
│    cognitive costs of AI writing tools                  │
│                                                         │
│  [ Apply selected ]                        [ Dismiss ]  │
└─────────────────────────────────────────────────────────┘
```

The user selects a direction or dismisses. If a direction is chosen, the system updates its internal understanding of the goal, which affects future Process 1 pushback and regeneration.

**Key distinction from Process 1:**

| | Process 1 | Process 2 |
|---|---|---|
| **Scope** | Phrase-level marks | Overall writing direction |
| **Initiated by** | User | System |
| **UI** | Click-toggle on text | Notification bar |
| **Frequency** | Every regeneration cycle | Only when misalignment detected |

---

## Phase 8: Awareness Layer -- Reliance Monitoring

A **minimal indicator** is always visible. Clicking it opens the full reliance view.

**Always-on indicator (top-right corner):**

```
┌─────────────────────────────────────────────────────────┐
│  CoWriThink                          [ ■■■□□ 62% ]   │
│                                         ↑ reliance bar  │
│  ...editor text...                   (always visible)   │
│                                                         │
└─────────────────────────────────────────────────────────┘

  ■■■□□ 62% = 62% of current text is user-authored or user-edited
              (higher = more user involvement)
```

**User clicks the indicator -- text-level color overlay activates:**

```
┌─────────────────────────────────────────────────────────┐
│  CoWriThink                          [ ■■■□□ 62% ]   │
│                                                         │
│  The rapid growth of AI writing tools has               │
│  ██ fundamentally changed ██ how people                 │
│  ▓▓ approach the craft of writing, ██ enabling          │
│  ██ users to produce text at ▒▒ remarkable              │
│  ██ speed.                                              │
│                                                         │
│  ██ = user-written (blue)                               │
│  ▓▓ = user-edited AI text (purple -- negotiated)        │
│  ▒▒ = AI-generated, accepted without edit (gray)        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Three authorship categories:**

| Color | Meaning | Reliance signal |
|-------|---------|-----------------|
| Blue (██) | User-written or user-typed from scratch | Low reliance |
| Purple (▓▓) | AI-generated but user edited in-place | Medium -- user engaged with the text |
| Gray (▒▒) | AI-generated, accepted as-is | High reliance -- potential blind spot |

**Secondary signal layer:** passive behavioral data (pause duration before accepting, cursor hovering patterns) can adjust the shade within each category. For example, an AI segment accepted after a long deliberate pause may appear lighter gray than one accepted instantly.

The overlay is **toggled off** by clicking the indicator again, returning to the normal writing view.

---

## Phase 9: Session End

The user saves and exits. No summary or reflection prompt -- the awareness layer is available during writing, not forced at the end.

Reliance data (marking history, authorship overlay, provenance log) is **persisted** so the user can review it when they reopen the document in a future session.

---

## Design Decisions Log

| # | Decision | Chosen | Date |
|---|----------|--------|------|
| 1 | Title | Supporting Appropriate Reliance in AI-Assisted Writing through Awareness and Intent Negotiation | 2026-02-01 |
| 2 | Awareness conception | Self-regulation oriented (reliance monitoring + quality awareness + provenance) | 2026-02-01 |
| 3 | Reliance data source | Primary: marking actions; Secondary: passive behavioral signals | 2026-02-01 |
| 4 | Process 1 action set | Preserve, Delete, Edit (no AI-mediated operations) | 2026-02-01 |
| 5 | Marking timing | Primarily post-generation | 2026-02-01 |
| 6 | Marking UI | No buttons; click toggle on text directly | 2026-02-01 |
| 7 | Progressive granularity | Click 1: word, Click 2: phrase, Click 3: sentence | 2026-02-02 |
| 8 | AI output appearance | Inline with diff highlight (green added, red strikethrough replaced) | 2026-02-02 |
| 9 | Session start | Required goal prompt + choice of blank editor or AI first draft | 2026-02-02 |
| 10 | AI request methods | Combination: select+trigger, prompt bar, and system-initiated offers | 2026-02-02 |
| 11 | Refusal UI | Inline orange highlight + tooltip with explanation; user can override | 2026-02-02 |
| 12 | Pushback triggers | Goal contradiction + structural coherence + quality concern | 2026-02-02 |
| 13 | Process 2 UI | Top/bottom notification bar with expandable options | 2026-02-02 |
| 14 | Process 2 trigger | Misalignment detection (user actions diverge from stated goal) | 2026-02-02 |
| 15 | Awareness visibility | Always-on minimal indicator + detailed text overlay on-demand | 2026-02-02 |
| 16 | Reliance visualization | Text-level color overlay (blue=user, purple=negotiated, gray=AI accepted) | 2026-02-02 |
| 17 | Session end | Simple save and exit; reliance data persisted for future sessions | 2026-02-02 |
