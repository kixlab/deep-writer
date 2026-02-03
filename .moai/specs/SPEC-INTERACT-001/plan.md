# SPEC-INTERACT-001: Implementation Plan

```yaml
spec_id: SPEC-INTERACT-001
title: Marking Interaction and AI Generation - Implementation Plan
version: 1.0.0
created: 2026-02-03
updated: 2026-02-03
author: Dr.WriThink
```

---

## 1. Implementation Overview

This plan covers the implementation of the core marking interaction (progressive granularity, toggle marking, edit mode), the regeneration flow with inline diff display, the AI request prompt bar, and the OpenAI GPT-4o server-side integration.

**Prerequisite**: SPEC-CORE-001 must be implemented first, providing the TipTap editor, text state system, provenance store, layout, and goal prompt.

---

## 2. Task Decomposition

### Milestone 1: Click Tracking and Progressive Granularity (Priority High)

**Goal**: Implement the click-based progressive selection system within TipTap.

**Task 1.1: Boundary Detection Utilities**
- Implement `getWordBoundary(doc, pos)` -- finds the word extent at a given ProseMirror position using whitespace boundaries.
- Implement `getPhraseBoundary(doc, pos)` -- expands from word to phrase using punctuation (`, ; :`) and conjunction (`and`, `but`, `or`, `which`, `that`) boundaries.
- Implement `getSentenceBoundary(doc, pos)` -- expands to sentence using terminating punctuation (`. ? !`) boundaries.
- All functions operate on the ProseMirror document model (not raw DOM text) to maintain state consistency.
- Unit tests for each boundary function with edge cases (punctuation at start/end, multiple spaces, abbreviations).

**Task 1.2: Click Tracking State Machine**
- Implement click counter logic: track `clickCount`, `lastClickRegion`, and `selectionLevel`.
- On click within the same region: increment `clickCount` (capped at 3).
- On click in a different region or outside text: reset counter to 1 or 0 respectively.
- Region identity determined by comparing the word-level boundary of the current click with the stored `lastClickRegion`.
- Integrate with TipTap's `handleClick` prop or a ProseMirror plugin `handleClick` handler.

**Task 1.3: Selection Visual Feedback**
- Apply TipTap decorations to visually highlight the currently selected region.
- Three visual levels: word (tight highlight), phrase (medium highlight with scope border), sentence (full sentence highlight with scope border).
- Use distinct border styling (e.g., dashed vs. solid) to indicate the current granularity level.
- Ensure decorations update on each click transition.

### Milestone 2: Toggle Marking and Edit Mode (Priority High)

**Goal**: Implement the mark/unmark/edit interaction on selected text.

**Task 2.1: MarkingExtension TipTap Extension**
- Create a TipTap extension (`MarkingExtension`) that registers:
  - `handleClick`: delegates to click tracking (Milestone 1) and toggle logic.
  - `handleDoubleClick`: enters edit mode on the double-clicked segment.
  - `handleKeyDown`: listens for Escape to exit edit mode.
- Extension manages ProseMirror marks or node attributes for segment states.

**Task 2.2: Toggle Logic Implementation**
- On click with active selection:
  - If segment is unmarked -> apply `marked-delete` (red strikethrough decoration).
  - If segment is `marked-delete` -> remove mark, return to unmarked.
  - If segment is `marked-preserve` -> toggle to `marked-delete`.
- State transitions stored as ProseMirror transactions to support undo/redo.
- Each toggle emits a provenance event: `{ type: 'mark-applied', segment, action, granularity, timestamp }`.

**Task 2.3: Edit Mode Implementation**
- Double-click places the cursor within the segment, enabling direct text input.
- While in edit mode, the segment has a visual indicator (e.g., blue cursor highlight, editable border).
- On Escape or click outside: commit edits, set segment state to `user-edited`, emit provenance event.
- Handle the case where user double-clicks inside a diff view segment (both red and green portions should be editable).

**Task 2.4: Mixed Selection Handling**
- When a click-and-drag or multi-click selection spans multiple authorship types, treat the full selection as one unit.
- Apply toggle action uniformly across all segments in the selection.
- Emit a single provenance event with the full span.

### Milestone 3: Regeneration Flow (Priority High)

**Goal**: Implement the Regenerate button, prompt construction, and inline diff display.

**Task 3.1: RegenerateButton Component**
- React component that observes the editor state for any `marked-delete` segments.
- Disabled state: no marks exist (gray, non-interactive).
- Enabled state: at least one mark exists (styled, clickable).
- Loading state: generation in progress (spinner, disabled).
- Positioned below the editor content area, above the prompt bar.

**Task 3.2: GenerationService Module**
- Orchestrates the regeneration pipeline:
  1. Scan the document for all `marked-delete` segments (gaps) and `marked-preserve` / `user-written` segments (constraints).
  2. Build the structured prompt (see spec.md Section 5.3).
  3. Call the `/api/generate` route with the payload.
  4. Parse the response JSON to extract gap fills.
  5. Apply gap fills to the document as `ai-pending` segments.
  6. Trigger diff display (Task 3.3).
  7. Log the full event to provenance.

**Task 3.3: DiffExtension TipTap Extension**
- Renders inline diffs using TipTap decorations:
  - Original text: red strikethrough (`original-removed` state).
  - AI replacement: green highlight (`ai-pending` state).
- Diff resolution on click:
  - Click red (original) -> restore original, discard AI replacement.
  - Click green (AI) -> reject AI, restore original.
- Multiple diffs can coexist; each resolved independently.
- On resolution, update segment state and emit provenance event.

**Task 3.4: Loading State During Generation**
- While generation is in progress:
  - Insert skeleton placeholders (pulsing gray boxes) at each gap position using TipTap decorations.
  - Set editor to read-only via TipTap's `editable` prop.
  - Disable the Regenerate button, show spinner.
  - Show loading indicator in the prompt bar.
- On completion or error: remove placeholders, restore editability.

### Milestone 4: AI Request Prompt Bar (Priority High)

**Goal**: Implement the dual-mode prompt bar for AI requests.

**Task 4.1: PromptBar Component**
- Persistent input bar fixed at the bottom of the editor area.
- Input field with placeholder text (e.g., "Type AI request here...").
- Send button (arrow icon) to the right of the input.
- Submit triggers: Enter key press or send button click.
- Clears input after submission.

**Task 4.2: Dual-Mode Detection**
- Before submission, detect the current editor state:
  - **With selection**: `editor.state.selection` is not empty -> target the selected text region for AI replacement.
  - **Without selection**: `editor.state.selection` is a cursor (empty selection) -> target the cursor position for continuation.
- Pass the detected mode and relevant positions to GenerationService.

**Task 4.3: Prompt Bar Request Flow**
- On submit:
  1. Determine mode (selection vs cursor).
  2. Construct prompt with user request text, goal, and context (selected region or cursor surroundings).
  3. Call `/api/generate` with the appropriate payload.
  4. Display result as inline diff (if replacing selection) or insert at cursor (if continuing).
  5. Log request in provenance: `{ type: 'prompt-request', text, selectionRange, cursorPos, timestamp }`.
- Show loading indicator during generation; clear on completion.

### Milestone 5: OpenAI GPT-4o API Route (Priority High)

**Goal**: Implement the server-side API route for secure OpenAI communication.

**Task 5.1: Route Handler Implementation**
- File: `app/api/generate/route.ts`
- HTTP method: POST
- Request body schema:
  ```typescript
  {
    goal: string;
    document: string;
    gaps: Array<{ id: string; position: { from: number; to: number } }>;
    constraints: Array<{ text: string; position: { from: number; to: number } }>;
    userRequest?: string;
    mode: 'regenerate' | 'selection' | 'continuation';
  }
  ```
- Response schema:
  ```typescript
  {
    gaps: Array<{ id: string; text: string }>;
  }
  ```

**Task 5.2: Prompt Engineering**
- System prompt establishes the CoWriThink assistant role.
- User prompt includes: goal, document with `[GAP]` markers, preserved constraints, and user request.
- Response format enforced via prompt instructions requesting structured JSON.
- Fallback parsing: if the model returns prose instead of JSON, attempt extraction.

**Task 5.3: Error Handling**
- Network errors: return `{ error: "Network error. Please try again." }` with 503 status.
- Rate limiting: return `{ error: "Rate limited. Please wait and retry." }` with 429 status.
- API errors (4xx/5xx from OpenAI): return `{ error: "Generation failed. Please try again." }` with appropriate status.
- Timeout: 30-second timeout on the fetch call; return timeout error.
- Client-side handling: display error message in a non-blocking toast/banner, keep marks intact, enable retry.

**Task 5.4: API Key Security**
- Store OpenAI API key in environment variable `OPENAI_API_KEY`.
- Access only in the server-side route handler.
- Validate that the key exists at startup; log a warning if missing.
- Never include the key in client-side bundles or responses.

### Milestone 6: Integration and Provenance (Priority Medium)

**Goal**: Wire all components together and ensure complete provenance logging.

**Task 6.1: Event Bus Integration**
- Connect MarkingExtension, DiffExtension, RegenerateButton, and PromptBar to the provenance store from SPEC-CORE-001.
- Ensure every user action generates a provenance event with consistent schema.

**Task 6.2: Editor State Synchronization**
- Ensure that marking state, diff state, and generation state are synchronized through TipTap's transaction system.
- Verify undo/redo works correctly across marking and diff resolution.

**Task 6.3: End-to-End Flow Testing**
- Manual testing of the full loop: write text -> mark segments -> regenerate -> review diff -> resolve -> mark again -> regenerate.
- Test prompt bar in both modes (with and without selection).
- Test error recovery: simulate API failure, verify marks preserved.

---

## 3. TipTap Extension Design

### MarkingExtension

```
Name: 'marking'
Type: Extension

Storage:
  - clickCount: number
  - lastClickRegion: { from: number, to: number } | null
  - selectionLevel: 'word' | 'phrase' | 'sentence' | null
  - editModeActive: boolean
  - editModeSegment: { from: number, to: number } | null

ProseMirror Plugin:
  - handleClick(view, pos, event): Progressive granularity + toggle logic
  - handleDoubleClick(view, pos, event): Enter edit mode
  - handleKeyDown(view, event): Escape exits edit mode
  - decorations(state): Renders selection highlights and mark visuals

Marks registered:
  - markedDelete: { inclusive: false, attrs: {} }
  - markedPreserve: { inclusive: false, attrs: {} }

Commands:
  - toggleMark(from, to, markType)
  - enterEditMode(from, to)
  - exitEditMode()
```

### DiffExtension

```
Name: 'diff'
Type: Extension

Storage:
  - activeDiffs: Map<string, { original: TextRange, replacement: TextRange }>

ProseMirror Plugin:
  - decorations(state): Renders red strikethrough for originals,
    green highlight for replacements
  - handleClick(view, pos, event): Resolves diff on click
    - Click on original-removed -> restore original
    - Click on ai-pending -> reject replacement

Commands:
  - insertDiff(gapId, originalRange, replacementText)
  - resolveDiff(gapId, action: 'restore' | 'reject')
  - clearAllDiffs()
```

---

## 4. Click Tracking Algorithm

```
Algorithm: ProgressiveGranularityTracker

Input: clickPosition (ProseMirror position)
State: { clickCount, lastRegion, level }

1. Compute wordRange = getWordBoundary(doc, clickPosition)
2. IF lastRegion is not null AND wordRange overlaps lastRegion:
     clickCount = min(clickCount + 1, 3)
   ELSE:
     clickCount = 1
     lastRegion = null

3. SWITCH clickCount:
     case 1:
       selectedRange = getWordBoundary(doc, clickPosition)
       level = 'word'
     case 2:
       selectedRange = getPhraseBoundary(doc, clickPosition)
       level = 'phrase'
     case 3:
       selectedRange = getSentenceBoundary(doc, clickPosition)
       level = 'sentence'

4. lastRegion = selectedRange
5. Apply decoration to selectedRange with level indicator
6. Return { selectedRange, level }
```

---

## 5. Boundary Detection Implementation

### Word Boundary

```
getWordBoundary(doc, pos):
  text = doc.textBetween(0, doc.content.size)
  charIndex = posToCharIndex(doc, pos)

  start = charIndex
  WHILE start > 0 AND text[start - 1] is not whitespace:
    start--

  end = charIndex
  WHILE end < text.length AND text[end] is not whitespace:
    end++

  RETURN { from: charIndexToPos(doc, start), to: charIndexToPos(doc, end) }
```

### Phrase Boundary

```
getPhraseBoundary(doc, pos):
  sentenceRange = getSentenceBoundary(doc, pos)
  sentenceText = doc.textBetween(sentenceRange.from, sentenceRange.to)
  offsetInSentence = pos - sentenceRange.from

  // Split by punctuation and conjunctions
  delimiters = /[,;:]|\b(and|but|or|which|that)\b/g
  segments = splitByDelimiters(sentenceText, delimiters)

  // Find the segment containing the click position
  currentOffset = 0
  FOR segment IN segments:
    segEnd = currentOffset + segment.length
    IF offsetInSentence >= currentOffset AND offsetInSentence < segEnd:
      RETURN {
        from: sentenceRange.from + currentOffset,
        to: sentenceRange.from + segEnd
      }
    currentOffset = segEnd

  RETURN sentenceRange  // fallback
```

### Sentence Boundary

```
getSentenceBoundary(doc, pos):
  text = doc.textBetween(0, doc.content.size)
  charIndex = posToCharIndex(doc, pos)

  start = charIndex
  WHILE start > 0:
    IF text[start - 1] in ['.', '?', '!'] AND start < text.length AND text[start] is whitespace:
      BREAK
    start--

  end = charIndex
  WHILE end < text.length:
    IF text[end] in ['.', '?', '!']:
      end++  // include the punctuation
      BREAK
    end++

  RETURN { from: charIndexToPos(doc, start), to: charIndexToPos(doc, end) }
```

---

## 6. OpenAI API Route Design

### Request Flow

```
Client (browser)
  |
  | POST /api/generate
  | Body: { goal, document, gaps, constraints, userRequest, mode }
  |
  v
Next.js Route Handler (server-side)
  |
  | 1. Validate request body
  | 2. Construct OpenAI prompt
  | 3. Call OpenAI Chat Completions API
  |    - model: "gpt-4o"
  |    - messages: [system, user]
  |    - temperature: 0.7
  |    - max_tokens: calculated based on gap sizes
  | 4. Parse response
  | 5. Return gap fills as JSON
  |
  v
Client (browser)
  |
  | Insert gap fills into editor
  | Display as inline diff
```

### Prompt Engineering Approach

**System message**: Establishes the role (CoWriThink writing assistant), constraints (fill gaps only, respect preserved text, match tone), and output format (structured JSON).

**User message**: Contains the user's goal, the full document with `[GAP:id]` markers replacing deleted segments, and the user's optional natural language request.

**Response parsing**: Expect JSON in the format `{ "gaps": [{ "id": "...", "text": "..." }] }`. If the response is not valid JSON, attempt to extract gap fills from prose using regex patterns as a fallback.

**Temperature**: 0.7 for balanced creativity and coherence. Adjustable per future study needs.

---

## 7. Component Architecture

```
app/
  api/
    generate/
      route.ts           -- OpenAI API route handler
  components/
    editor/
      MarkingExtension.ts  -- TipTap marking extension
      DiffExtension.ts     -- TipTap diff extension
      RegenerateButton.tsx  -- Regenerate button component
      PromptBar.tsx         -- AI request prompt bar
    hooks/
      useGeneration.ts     -- Generation state management hook
  services/
    generation.ts          -- GenerationService (prompt construction, API calls)
  types/
    generation.ts          -- TypeScript interfaces for generation payloads
```

---

## 8. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| TipTap click handler conflicts with native browser selection | Medium | High | Use ProseMirror plugin `handleClick` which fires before native handlers; return `true` to prevent default behavior when handling marking clicks |
| Progressive granularity feels unintuitive to users | Medium | Medium | Clear visual feedback (growing highlight, border changes) at each level; user study will validate |
| OpenAI response format inconsistency (prose instead of JSON) | Medium | Medium | Implement fallback parsing; add explicit format instructions in system prompt; validate response schema before applying |
| Latency of GPT-4o API degrades user experience | Medium | Medium | Show skeleton placeholders immediately; consider shorter max_tokens for quicker responses; 30s timeout with clear error message |
| Click tracking conflicts with double-click (edit mode) | Low | High | Double-click handler runs before single-click progression; debounce single clicks with a short delay (200ms) to distinguish from double-clicks |
| Large document overwhelms API token limit | Low | Medium | For documents under 5000 words (study scope), full context fits in GPT-4o window; for safety, truncate distant context and prioritize surrounding text |
| localStorage quota exceeded during long sessions | Low | Low | Monitor storage usage; warn user when approaching 80% of quota; provenance events use compact JSON |
| Edit mode and diff view state conflicts | Low | Medium | Disable edit mode entry within unresolved diff segments, or clearly define behavior (editing within diff commits user's version) |

---

## Traceability

| Task | Requirement | Component |
|------|------------|-----------|
| M1 (Tasks 1.1-1.3) | REQ-1 | MarkingExtension |
| M2 (Tasks 2.1-2.4) | REQ-2, REQ-5 | MarkingExtension |
| M3 (Tasks 3.1-3.4) | REQ-3, REQ-4, REQ-8 | RegenerateButton, GenerationService, DiffExtension |
| M4 (Tasks 4.1-4.3) | REQ-6 | PromptBar |
| M5 (Tasks 5.1-5.4) | REQ-7 | API Route |
| M6 (Tasks 6.1-6.3) | All REQs | Integration |
