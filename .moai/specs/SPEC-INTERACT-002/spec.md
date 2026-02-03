# SPEC-INTERACT-002: Editor Interaction Redesign

## Status
Completed

## Summary
Redesign the editor's text interaction model to replace the current confusing click-counting mechanism with intuitive, context-aware interactions across two modes: plain editor and split diff view.

---

## Current Problems

1. **Click counting causes concurrent actions**: Clicking the same spot triggers both marking (delete) and expansion (sentence level) simultaneously, making behavior unpredictable.
2. **Word highlight has 200ms delay**: The debounce timer causes a noticeable lag on single click, making the UI feel unresponsive.
3. **No discoverable UI**: Users have no visual guidance on what clicking, double-clicking, or triple-clicking does. The interaction model is entirely hidden.
4. **No inline alternative suggestions**: Users must go through the full Regenerate flow to get AI suggestions, even for small word/phrase changes.

---

## Proposed Interactions

### Mode 1: Plain Editor (Normal Editing)

#### REQ-1: Single Click — Word Highlight (Immediate)
- **When** the user single-clicks on a word in the editor
- **Then** the word is highlighted immediately with no delay
- **Note**: Remove the current 200ms debounce. Highlight must appear on mousedown or click, not after a timer.

#### REQ-2: Double Click — Phrase Selection
- **When** the user double-clicks on text
- **Then** the selection expands to phrase level
- **Phrase definition**: Text segment bounded by punctuation (commas, semicolons, colons) or conjunctions (and, but, or, which, that). May include multiple connected clauses via n-gram proximity.

#### REQ-3: Triple Click — Sentence Selection
- **When** the user triple-clicks on text
- **Then** the selection expands to the full sentence
- **Sentence definition**: Text segment bounded by sentence terminators (. ? !)

#### REQ-4: Drag Selection — AI Alternative Suggestions Tooltip
- **When** the user drags to select any text (word, phrase, clause, or arbitrary range)
- **Then** a floating tooltip appears near the selection
- **The tooltip** displays 3-4 AI-generated alternative phrasings for the selected text
- **When** the user clicks an alternative
- **Then** the selected text is immediately replaced with the chosen alternative
- **When** the user clicks outside the tooltip or presses Escape
- **Then** the tooltip dismisses without changes
- **API**: Call `/api/generate` (or a lightweight endpoint) with the selected text, surrounding context, and writing goal to generate alternatives
- **Latency**: Show a brief loading indicator in the tooltip while alternatives are being generated

### Mode 2: Split Diff View (Original / Modified side-by-side)

#### REQ-5: Drag Selection — Clause-Level Snap with Keep/Delete Tooltip
- **When** the user drags to select text in the split diff view
- **Then** the selection automatically snaps to clause boundaries (not character-by-character)
- **Clause snap**: Selection expands to the nearest clause boundary on both ends
- **Then** a tooltip appears with two options: "Keep" and "Delete"
- **When** the user selects "Delete"
- **Then** the clause is marked for deletion (red background) and excluded from the accepted result
- **When** the user selects "Keep"
- **Then** the clause is marked for preservation (green background) and included in the accepted result

---

## Interactions to Remove

| Current Interaction | Reason for Removal |
|--------------------|--------------------|
| Click-count based marking (1st=highlight, 2nd=mark-delete, 3rd=expand) | Concurrent actions, unpredictable behavior |
| 200ms debounce on single click | Causes perceived lag, bad UX |
| Automatic marked-delete toggle on repeated clicks | Replaced by explicit Keep/Delete tooltip in diff view |

---

## Visual Design

### Alternative Suggestions Tooltip (REQ-4)
- Floating panel anchored below or above the selection
- Light background with subtle shadow/border
- Each alternative is a clickable row with hover highlight
- Loading state: skeleton lines or spinner
- Max 4 alternatives displayed
- Dismiss: click outside, Escape key, or scroll

### Keep/Delete Tooltip (REQ-5)
- Compact tooltip with two buttons: "Keep" (green) and "Delete" (red)
- Appears near the snapped selection
- Clause-level selection highlighted with a subtle border during drag

### Click/Selection Highlights
- **Single click (word)**: Light blue background (`marking-selection-word`), no delay
- **Double click (phrase)**: Medium blue with dashed underline (`marking-selection-phrase`)
- **Triple click (sentence)**: Blue with solid underline (`marking-selection-sentence`)

---

## Technical Approach

### Files to Modify
- `src/extensions/MarkingExtension.ts` — Rewrite click handler: remove debounce, remove click-count toggle logic, keep word/phrase/sentence expansion
- `src/app/globals.css` — Update selection styles if needed

### Files to Create
- `src/components/editor/AlternativesTooltip.tsx` — Floating tooltip for AI alternative suggestions (REQ-4)
- `src/components/editor/KeepDeleteTooltip.tsx` — Floating tooltip for Keep/Delete actions in diff view (REQ-5)
- `src/hooks/useAlternatives.ts` — Hook to fetch AI alternatives for selected text
- `src/app/api/alternatives/route.ts` — Lightweight API endpoint for generating alternative phrasings (or extend `/api/generate`)

### Files to Modify for Diff View Integration
- `src/components/editor/DiffSplitView.tsx` — Add drag selection with clause snapping and Keep/Delete tooltip on the Modified panel

### Key Implementation Notes
- **Tooltip positioning**: Use `getBoundingClientRect()` on the selection range to position the tooltip
- **Clause boundary snapping**: Reuse `getPhraseBoundary()` / `getSentenceBoundary()` from `src/lib/boundaries.ts`, extend to clause-level detection
- **Alternative generation**: Send selected text + 200 chars of surrounding context + writing goal to API. Request 3-4 short alternatives. Use low `max_tokens` (256) for fast response.
- **Selection replacement**: Use TipTap `editor.chain().focus().insertContentAt({from, to}, selectedAlternative).run()`

---

## Acceptance Criteria

- [ ] Single click highlights word instantly (no perceptible delay)
- [ ] Double click selects phrase, triple click selects sentence
- [ ] Click-count based marking is fully removed
- [ ] Dragging text in plain editor shows AI alternatives tooltip
- [ ] Clicking an alternative replaces the selected text
- [ ] Dragging text in split diff view snaps to clause boundaries
- [ ] Keep/Delete tooltip appears in split diff view after drag selection
- [ ] Tooltips dismiss on Escape or click outside
- [ ] All interactions work in both light and dark mode
