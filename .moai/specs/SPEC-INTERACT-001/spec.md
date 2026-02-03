# SPEC-INTERACT-001: Marking & AI Generation

```yaml
id: SPEC-INTERACT-001
title: Marking Interaction and AI Generation
version: 1.0.0
status: draft
created: 2026-02-03
updated: 2026-02-03
author: Dr.WriThink
priority: P0
depends_on:
  - SPEC-CORE-001
tags:
  - marking
  - ai-generation
  - tiptap
  - progressive-granularity
  - prompt-bar
  - openai
```

---

## HISTORY

| Version | Date       | Author      | Changes                                |
|---------|------------|-------------|----------------------------------------|
| 1.0.0   | 2026-02-03 | Dr.WriThink | Initial SPEC creation for marking interaction, regeneration flow, prompt bar, and OpenAI integration |

---

## 1. Environment

- **Project**: CoWriThink -- AI-assisted writing tool promoting writer autonomy
- **Platform**: Web application (browser-based)
- **Tech Stack**: Next.js 15 App Router, React 19, TipTap/ProseMirror, Tailwind CSS, localStorage
- **AI Backend**: OpenAI GPT-4o via server-side Next.js route handler
- **Target Users**: Participants in a user study on AI-assisted writing and reliance patterns
- **Prototype Scope**: Greenfield prototype; no legacy code or backward compatibility required
- **Interaction Model**: Mouse-only for the prototype (no keyboard shortcuts)

---

## 2. Assumptions

- **A1**: SPEC-CORE-001 provides a functioning TipTap editor with text state tracking (user-written, ai-generated, ai-pending, user-edited, marked-preserve, marked-delete, original-removed), a provenance store with localStorage persistence, the overall layout (editor 70% + side panel 30%), and the goal prompt feature.
- **A2**: TipTap/ProseMirror supports custom node decorations and marks sufficient for implementing progressive granularity selection and inline diff display.
- **A3**: The OpenAI GPT-4o API is accessible and provides reliable structured responses suitable for gap-filling generation within the expected latency (under 10 seconds for typical requests).
- **A4**: Users interact exclusively via mouse clicks and the prompt bar input field. No keyboard shortcuts are required for this SPEC.
- **A5**: The document size for the user study is expected to remain under 5000 words, keeping localStorage and API token limits manageable.
- **A6**: The provenance store from SPEC-CORE-001 exposes an API for logging events and querying text segment metadata (authorship type, position, state).

---

## 3. Requirements

### REQ-1: Progressive Granularity Selection

**WHEN** the user clicks on a text segment for the first time, **THEN** the system **shall** select and highlight the word at the click position, using whitespace boundaries to determine word extent.

**WHEN** the user clicks on the same region a second time (within the already-selected scope), **THEN** the system **shall** expand the selection to the phrase level, splitting by punctuation characters (comma, semicolon, colon) and coordinating conjunctions ("and", "but", "or", "which", "that").

**WHEN** the user clicks on the same region a third time, **THEN** the system **shall** expand the selection to the sentence level, using sentence-terminating punctuation (period, question mark, exclamation mark) as boundaries.

**WHEN** the user clicks outside the currently selected region, **THEN** the system **shall** deselect the current selection and reset the click counter, so that any subsequent click on text starts from word level.

The system **shall** provide visual feedback for each granularity level, with the selected region visibly growing and a distinct highlight border indicating the current selection scope.

### REQ-2: Toggle Marking Behavior

**WHEN** the user clicks on unmarked text (at the current granularity selection), **THEN** the system **shall** mark the selected segment as deleted, displaying it with a red strikethrough visual treatment.

**WHEN** the user clicks on text that is already marked as deleted, **THEN** the system **shall** toggle the segment back to unmarked state, removing the red strikethrough.

**WHEN** the user clicks on text that is marked as preserved, **THEN** the system **shall** toggle the segment to deleted state.

**WHEN** the user double-clicks on any text segment regardless of its current state, **THEN** the system **shall** enter edit mode for that segment, placing a text cursor at the click position and allowing direct text editing.

**WHEN** the user presses Escape or clicks outside the segment while in edit mode, **THEN** the system **shall** exit edit mode, commit any text changes, and update the segment state to user-edited if modifications were made.

### REQ-3: Regeneration Trigger and Flow

The system **shall** display a "Regenerate" button that is visible but disabled when no segments are marked for deletion.

**WHEN** at least one text segment is marked for deletion, **THEN** the system **shall** enable the "Regenerate" button.

**WHEN** the user clicks the enabled "Regenerate" button, **THEN** the system **shall** execute the following sequence:
1. Collect all marked-delete segments and send them as gaps to be filled.
2. Collect all marked-preserve segments and user-written segments and send them as constraints that must not be altered.
3. Include the user's current writing goal in the generation prompt.
4. Send the structured prompt to the OpenAI GPT-4o API.
5. Display the AI-generated text for each gap as an inline diff, showing the original text with red strikethrough alongside the green-highlighted AI replacement.
6. Log the complete regeneration event in the provenance store, including the prompt, constraints, gap positions, and generated output.

**While** a regeneration request is in progress, the system **shall** display a skeleton placeholder (pulsing gray) in each gap region, disable the Regenerate button with a spinner, show a loading indicator in the prompt bar, and set the editor to read-only mode preventing marking or editing.

### REQ-4: Inline Diff Display and Resolution

**WHEN** AI generation completes for one or more gaps, **THEN** the system **shall** display an inline diff view for each gap showing the original text with red strikethrough and the AI replacement with green highlight, positioned directly below or adjacent to the original.

**WHEN** the user clicks on a red (original-removed) segment in the diff view, **THEN** the system **shall** restore the original text and discard the AI replacement for that span.

**WHEN** the user clicks on a green (AI replacement) segment in the diff view, **THEN** the system **shall** reject the AI replacement and restore the original text for that span.

Multiple unresolved diffs **shall** be allowed to coexist in the document simultaneously. The user **shall** be able to resolve each diff independently.

### REQ-5: Mixed Selection Behavior

**WHEN** the user selects text that spans multiple authorship types (user-written, ai-generated, user-edited, or any combination), **THEN** the system **shall** treat the entire selection as one unit for marking purposes. Toggling shall apply uniformly to the whole selection.

### REQ-6: AI Request Prompt Bar

The system **shall** display a persistent prompt bar at the bottom of the editor area, always visible and accessible.

**WHEN** the user has an active text selection and types a request in the prompt bar and submits (Enter key or send button click), **THEN** the system **shall** send the request to the AI with the selected region as the target scope, generating replacement text for the selection.

**WHEN** the user has no active text selection but has a cursor position, and types a request in the prompt bar and submits, **THEN** the system **shall** send the request to the AI to generate continuation text at the cursor position based on the request and surrounding context.

The system **shall** log each prompt bar request in the provenance store, including the request text, the selection range (if any), and the cursor position.

**While** the AI is generating in response to a prompt bar request, the system **shall** show a loading indicator in the prompt bar.

The system **shall not** display previous requests as chat history. Each request is independent and the prompt bar clears after submission.

### REQ-7: OpenAI GPT-4o Server-Side Integration

The system **shall** implement the OpenAI GPT-4o integration as a Next.js App Router route handler (API route) to protect the API key from client-side exposure.

The API route **shall** accept a structured request containing: the user's writing goal, preserved text constraints with their positions, gap positions to fill, and the user's natural language request (if from prompt bar).

The API route **shall** construct a prompt that includes: the full document context with clearly marked preserved segments, the gap positions requiring generation, the user's writing goal as a guiding directive, and any specific user request text.

**If** the OpenAI API call fails (network error, rate limit, server error, or timeout), **then** the system **shall** display a non-blocking error message to the user, preserve all existing marks and text state unchanged, and provide a retry option.

The system **shall not** expose the OpenAI API key to the client. All API communication **shall** be routed through the server-side handler.

### REQ-8: Regeneration for Edge Cases

**WHEN** the user marks all text in the document for deletion and clicks Regenerate, **THEN** the system **shall** generate entirely new text from scratch based on the writing goal, equivalent to generating an AI first draft.

**If** no segments are marked for deletion, **then** the system **shall** keep the Regenerate button disabled, preventing unnecessary API calls.

---

## 4. Technical Constraints

- **TC-1**: The marking interaction must be implemented as a TipTap extension (ProseMirror plugin) to integrate with the editor's transaction and decoration systems from SPEC-CORE-001.
- **TC-2**: Progressive granularity click detection must use a click counter with a timeout or region-based reset mechanism to distinguish sequential same-region clicks from new selections.
- **TC-3**: Boundary detection algorithms (word, phrase, sentence) must operate on the ProseMirror document model, not raw DOM text, to maintain consistency with editor state.
- **TC-4**: The OpenAI API route must be implemented at `app/api/generate/route.ts` using Next.js 15 App Router conventions.
- **TC-5**: API request payloads to OpenAI must stay within the GPT-4o context window limit. For documents under 5000 words, the full document context plus prompt should fit within the token budget.
- **TC-6**: Inline diff rendering must use TipTap decorations (not DOM manipulation) to maintain editor state consistency and undo/redo integrity.
- **TC-7**: All state transitions (marking, toggling, edit mode) must generate provenance events logged via the store from SPEC-CORE-001.
- **TC-8**: The prompt bar component must coexist with the TipTap editor without capturing keyboard events intended for in-editor editing.

---

## 5. Specifications

### 5.1 Click Tracking State Machine

```
State: { clickCount: 0, lastClickRegion: null, selectionLevel: null }

On click(position):
  region = getRegionAt(position)
  IF region == lastClickRegion:
    clickCount = min(clickCount + 1, 3)
  ELSE:
    clickCount = 1
    lastClickRegion = region

  SWITCH clickCount:
    1 -> select word at position (whitespace boundaries)
    2 -> select phrase at position (punctuation + conjunction boundaries)
    3 -> select sentence at position (sentence-terminating punctuation)

On click(outside_any_text):
  clickCount = 0
  lastClickRegion = null
  selectionLevel = null
  clear selection
```

### 5.2 Boundary Detection Rules

**Word boundaries**: Characters between whitespace characters (space, tab, newline). Leading/trailing punctuation attached to a word is included with the word.

**Phrase boundaries**: Text segments delimited by:
- Punctuation: `, ; :`
- Conjunctions: `and`, `but`, `or`, `which`, `that`
- Sentence boundaries also serve as phrase boundaries.

**Sentence boundaries**: Text segments terminated by:
- `.` `?` `!`
- Followed by whitespace or end-of-document.
- Abbreviations (e.g., "Dr.", "U.S.") should not trigger false sentence breaks where possible, though perfect handling is not required for the prototype.

### 5.3 Prompt Structure for Gap-Filling

```
System: You are a writing assistant for CoWriThink. Generate text ONLY
for the [GAP] markers. Preserve all other text exactly. Match the tone,
style, and argument direction of the preserved text.

User Goal: {goal_text}

Document with gaps:
{preserved_text_1}
[GAP: {gap_id}]
{preserved_text_2}
[GAP: {gap_id}]
{preserved_text_3}

User request (if any): {prompt_bar_text}

Instructions:
- Fill each [GAP] with coherent text that connects smoothly with
  surrounding preserved segments.
- Respect the user's writing goal.
- Do not modify preserved text.
- Return the gap fills as a structured JSON:
  { "gaps": [{ "id": "{gap_id}", "text": "generated text" }] }
```

### 5.4 Component Architecture

| Component | Type | Responsibility |
|-----------|------|---------------|
| `MarkingExtension` | TipTap Extension | Progressive granularity selection, click tracking, toggle marking, edit mode |
| `DiffExtension` | TipTap Extension | Inline diff rendering, diff resolution (click to restore/reject) |
| `RegenerateButton` | React Component | Enabled/disabled state based on marks, triggers regeneration flow |
| `PromptBar` | React Component | Input field, dual-mode detection (selection vs cursor), submit handling |
| `GenerationService` | Service Module | Orchestrates prompt construction, API calls, response parsing |
| `useGeneration` | React Hook | Manages generation state (idle, loading, error, complete) for UI |
| `app/api/generate/route.ts` | API Route | Server-side OpenAI GPT-4o communication, API key protection |

---

## 6. Dependencies

| Dependency | SPEC | Description |
|------------|------|-------------|
| TipTap Editor | SPEC-CORE-001 | Base editor instance with ProseMirror document model |
| Text State System | SPEC-CORE-001 | Text segment state tracking (user-written, ai-generated, etc.) |
| Provenance Store | SPEC-CORE-001 | Event logging API for marking, generation, and editing events |
| Layout | SPEC-CORE-001 | Editor area (70%) where marking and diff display occur |
| Goal Feature | SPEC-CORE-001 | Current writing goal text, required for generation prompts |
| Pushback System | SPEC-GUARD-001 | Post-regeneration pushback evaluation (called after step 5 of REQ-3, but pushback logic itself is defined in SPEC-GUARD-001) |

---

## 7. Out of Scope

- Keyboard shortcuts for marking or selection (mouse-only for prototype)
- Chat history or conversation threading in the prompt bar
- Streaming/real-time token display during AI generation
- Multi-user collaboration or concurrent editing
- Pushback logic and UI (belongs to SPEC-GUARD-001)
- Process 2 objective surfacing (belongs to SPEC-PROC2-001)
- Awareness/reliance overlay and scoring (belongs to SPEC-AWARE-001)

---

## Traceability

| Requirement | Design Feature | Design Rationale |
|-------------|---------------|-----------------|
| REQ-1 | Feature 3: Progressive Granularity | DR4 (fine-grained control), DR5 (low-effort intent) |
| REQ-2 | Feature 3: Toggle Behavior | DR4 (fine-grained control), DR1 (reliance awareness via marking data) |
| REQ-3 | Feature 3: Regeneration Trigger | DR2 (collaborative AI), DR3 (reflective space) |
| REQ-4 | Feature 2: Diff Display | DR1 (reliance awareness), DR3 (reflective space), DR4 (fine-grained control) |
| REQ-5 | Feature 2: Mixed Selections | DR4 (fine-grained control) |
| REQ-6 | Feature 8: Prompt Bar | DR5 (low-effort intent), DR2 (collaborative AI) |
| REQ-7 | OpenAI Integration | Infrastructure requirement for all AI features |
| REQ-8 | Edge Cases E1, E2 | DR2 (collaborative AI), robustness |
