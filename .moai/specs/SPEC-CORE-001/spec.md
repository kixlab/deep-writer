---
id: SPEC-CORE-001
title: "Editor Foundation & Data Model"
version: "1.0.0"
status: completed
created: 2026-02-03
updated: 2026-02-03
author: Dr.WriThink
priority: P0
lifecycle: spec-first
tags: ["editor", "foundation", "data-model", "goal-prompt", "provenance", "text-states", "layout"]
depends_on: []
blocks: ["SPEC-CORE-002", "SPEC-CORE-003", "SPEC-CORE-004"]
---

# SPEC-CORE-001: Editor Foundation & Data Model

## HISTORY

| Version | Date       | Author      | Description                                      |
|---------|------------|-------------|--------------------------------------------------|
| 1.0.0   | 2026-02-03 | Dr.WriThink | Initial SPEC creation covering Features 1, 2, 7, 9, 10 |

---

## 1. Environment

### 1.1 Project Context

CoWriThink is an AI-assisted writing tool designed to promote writer autonomy rather than passive AI consumption. This SPEC defines the foundation layer that all other features depend on: the goal prompt system, the rich text editor with 7 text states, the provenance data store, the application layout, and loading state management.

This is a **greenfield prototype** built for a controlled user study. Production-level concerns (scalability, multi-user, server persistence) are explicitly out of scope.

### 1.2 Technology Stack

| Component         | Technology                           |
|-------------------|--------------------------------------|
| Framework         | Next.js 15 App Router                |
| UI Library        | React 19                             |
| Editor Engine     | TipTap (built on ProseMirror)        |
| Styling           | Tailwind CSS                         |
| State Management  | Zustand                              |
| Persistence       | localStorage (browser)               |
| AI Provider       | OpenAI GPT-4o API                    |
| Language          | TypeScript 5.x                       |

### 1.3 Constraints

- **Browser-only**: No server-side database. All data persists in localStorage.
- **Single-user**: No authentication, no concurrent sessions.
- **Prototype scope**: No keyboard shortcuts (mouse-only interaction), no undo/redo history beyond browser defaults, no mobile responsiveness.
- **localStorage limit**: Approximately 5-10 MB per origin. Must warn users when approaching storage limits.

---

## 2. Assumptions

| ID   | Assumption                                                                 | Confidence | Risk if Wrong                                   |
|------|---------------------------------------------------------------------------|------------|--------------------------------------------------|
| A-01 | TipTap can support custom decorations for all 7 text states simultaneously | High       | Must implement ProseMirror plugin layer directly  |
| A-02 | localStorage capacity (5-10 MB) is sufficient for a single user study session | High    | Add storage limit warning and truncation strategy |
| A-03 | Users have a modern browser (Chrome 120+, Firefox 120+, Safari 17+)       | High       | Degraded styling, no fallback planned             |
| A-04 | OpenAI GPT-4o API is available with acceptable latency (<5s for typical requests) | Medium | Loading states and retry logic must handle delays |
| A-05 | ProseMirror document model can represent overlapping decorations for diff view | High   | Restructure to use non-overlapping node-based states |
| A-06 | Zustand state updates will not cause performance issues with large documents (3000+ words) | Medium | May need selective re-rendering or virtualization |

---

## 3. Requirements

### 3.1 Goal Prompt System (Feature 1)

**REQ-CORE-001**: Ubiquitous -- Goal Persistence

The system shall always display the current writing goal in the editor header in a collapsed, expandable format after the goal has been set.

**REQ-CORE-002**: Event-Driven -- Goal Entry on Session Start

WHEN a new session starts, THEN the system shall display a modal dialog with a text input labeled "What are you writing?" with a placeholder example and a submit button, and the modal shall not dismiss until the user enters non-empty text.

**REQ-CORE-003**: Event-Driven -- Start Mode Selection

WHEN the user submits a writing goal, THEN the system shall present two action buttons: "Start from scratch" (which opens an empty editor) and "Generate AI first draft" (which triggers AI text generation based on the goal).

**REQ-CORE-004**: Event-Driven -- Goal Manual Edit

WHEN the user clicks the edit control on the goal display in the header or side panel, THEN the system shall enable inline editing of the goal text, and upon confirmation the system shall update the active goal and log a goal-changed provenance event with change source "manual".

**REQ-CORE-005**: Unwanted -- Blank Goal Submission

The system shall not allow the user to proceed past the goal prompt modal with an empty or whitespace-only goal text.

**REQ-CORE-006**: State-Driven -- Living Goal Evolution

IF the goal is updated via manual edit, Process 2 direction selection, or system inference, THEN the system shall update the stored goal, append an entry to goalHistory, and use the updated goal for all subsequent AI generation, pushback evaluation, and Process 2 detection.

### 3.2 Editor and Text States (Feature 2)

**REQ-CORE-007**: Ubiquitous -- Seven Text States

The editor shall always track and visually distinguish the following 7 text segment states using TipTap decorations:

| State              | Visual Treatment                  |
|--------------------|-----------------------------------|
| `user-written`     | Default (no highlight)            |
| `ai-generated`     | Green highlight                   |
| `ai-pending`       | Green highlight (within diff view)|
| `user-edited`      | Subtle underline or border        |
| `marked-preserve`  | Green background                  |
| `marked-delete`    | Red strikethrough                 |
| `original-removed` | Red strikethrough (within diff)   |

**REQ-CORE-008**: Ubiquitous -- State Transition Integrity

The system shall always enforce valid state transitions for text segments according to the defined state machine: `user-written` can transition to `marked-delete`; `ai-generated` can transition to `user-edited`, `marked-preserve`, or `marked-delete`; `ai-pending` can transition to `ai-generated` (accepted) or be discarded (rejected); `marked-delete` segments can toggle back to their previous state.

**REQ-CORE-009**: Event-Driven -- Diff Display on AI Generation

WHEN AI generates replacement text, THEN the system shall display both the original text (with red strikethrough as `original-removed`) and the AI replacement text (with green highlight as `ai-pending`) inline in the editor. The diff shall remain visible until the user explicitly interacts with it.

**REQ-CORE-010**: Event-Driven -- Diff Interaction

WHEN the user clicks on red (original-removed) text in a diff, THEN the system shall restore the original text and discard the corresponding AI replacement. WHEN the user clicks on green (ai-pending) text in a diff, THEN the system shall reject the AI replacement and restore the original text for that span.

**REQ-CORE-011**: Unwanted -- Auto-Collapse of Unresolved Diffs

The system shall not automatically collapse or auto-accept any diff. Every diff segment shall require explicit user interaction (click to restore original, click to reject AI, or double-click to edit in-place) before it resolves.

**REQ-CORE-012**: Event-Driven -- Edit In-Place

WHEN the user double-clicks any text segment, THEN the system shall activate inline editing mode with a cursor, and upon exiting edit mode (click outside or Escape) the modified text shall transition to state `user-edited` and a provenance event shall be logged.

### 3.3 Provenance Store (Feature 7)

**REQ-CORE-013**: Ubiquitous -- Event Logging

The system shall always log every user interaction as a ProvenanceEvent with a unique ID, event type, timestamp, and event-specific data payload. Logged event types include: text-typed, ai-generation-requested, ai-generation-received, mark-applied, edit-in-place, pushback-shown, pushback-response, process2-shown, process2-response, awareness-toggled, and goal-changed.

**REQ-CORE-014**: Ubiquitous -- Session Data Structure

The system shall always maintain a Session object with the following structure: id (string), goal (current goal string), goalHistory (array of GoalChange entries), documentState (current ProseMirror document JSON), provenanceLog (array of ProvenanceEvent), relianceScores (array of SegmentScore), createdAt (timestamp), and lastModifiedAt (timestamp).

**REQ-CORE-015**: Event-Driven -- Session Persistence

WHEN the document state or provenance log changes, THEN the system shall persist the updated Session object to localStorage with debounced writes (300ms delay) to prevent excessive I/O.

**REQ-CORE-016**: Event-Driven -- Session Export

WHEN the user clicks the "Export Session" button, THEN the system shall generate a JSON file containing the complete Session object (including provenance log, document state, goal history, and reliance scores) and trigger a browser download.

**REQ-CORE-017**: State-Driven -- Storage Limit Warning

IF localStorage usage exceeds 80% of estimated capacity (approximately 4 MB), THEN the system shall display a non-blocking warning notification informing the user to export their session data.

**REQ-CORE-018**: Unwanted -- Data Loss on Storage Failure

The system shall not silently discard provenance events if a localStorage write fails. The system shall queue failed writes and retry, and if retries exhaust, shall display an error notification to the user.

### 3.4 Layout (Feature 9)

**REQ-CORE-019**: Ubiquitous -- Split Layout

The application shall always render a two-column layout: the editor occupying 70% width and a collapsible side panel occupying 30% width.

**REQ-CORE-020**: Event-Driven -- Side Panel Toggle

WHEN the user clicks the side panel toggle button, THEN the system shall collapse the side panel (giving 100% width to the editor) or expand it back to the 70/30 split.

**REQ-CORE-021**: Ubiquitous -- Side Panel Sections

The side panel shall always contain the following sections in order: Goal (editable, always visible at top), Pushback Comments (visible when pushback warnings are active), Round History (chronological list of marking-regeneration rounds with reliance levels), and Document Outline (auto-generated paragraph summaries with click-to-scroll).

### 3.5 Loading States (Feature 10)

**REQ-CORE-022**: State-Driven -- Skeleton Placeholder During Generation

IF AI generation is in progress, THEN the system shall display a pulsing gray skeleton placeholder in the editor region where AI text will appear, disable the Regenerate button with a spinner, show a progress indicator on the prompt bar, and set the editor to read-only mode.

**REQ-CORE-023**: State-Driven -- Side Panel Interactivity During Loading

IF AI generation is in progress, THEN the side panel shall remain fully interactive, allowing the user to read the goal, review round history, and navigate the document outline.

**REQ-CORE-024**: Event-Driven -- Loading State Termination

WHEN AI generation completes (success or failure), THEN the system shall remove the skeleton placeholder, restore editor interactivity, re-enable the Regenerate button, and clear the progress indicator. On failure, the system shall display a non-blocking error message: "Generation failed. Please try again."

**REQ-CORE-025**: Optional -- Streaming AI Response

Where the AI provider supports streaming responses, the system shall progressively render AI-generated text as tokens arrive rather than waiting for the complete response.

---

## 4. Specifications

### 4.1 Data Model

```typescript
// Core types for the Session and Provenance system

interface Session {
  id: string;
  goal: string;
  goalHistory: GoalChange[];
  documentState: JSONContent; // ProseMirror/TipTap document JSON
  provenanceLog: ProvenanceEvent[];
  relianceScores: SegmentScore[];
  createdAt: number;
  lastModifiedAt: number;
}

interface GoalChange {
  previousGoal: string;
  newGoal: string;
  source: 'manual' | 'process2' | 'inferred';
  timestamp: number;
}

type EventType =
  | 'text-typed'
  | 'ai-generation-requested'
  | 'ai-generation-received'
  | 'mark-applied'
  | 'edit-in-place'
  | 'pushback-shown'
  | 'pushback-response'
  | 'process2-shown'
  | 'process2-response'
  | 'awareness-toggled'
  | 'goal-changed';

interface ProvenanceEvent {
  id: string;
  type: EventType;
  timestamp: number;
  data: Record<string, unknown>;
}

interface SegmentScore {
  spanStart: number;
  spanEnd: number;
  text: string;
  score: number; // 0-100
  authorship: 'user' | 'ai' | 'negotiated';
  justification: string;
}

type TextState =
  | 'user-written'
  | 'ai-generated'
  | 'ai-pending'
  | 'user-edited'
  | 'marked-preserve'
  | 'marked-delete'
  | 'original-removed';
```

### 4.2 Text State Transition Rules

```
user-written     -> marked-delete (click to mark)
marked-delete    -> user-written  (click to toggle back)
ai-generated     -> marked-preserve | marked-delete | user-edited
ai-pending       -> ai-generated (accepted) | discarded (rejected)
marked-preserve  -> marked-delete (toggle)
marked-delete    -> marked-preserve (toggle)
any state        -> user-edited (double-click edit in-place)
original-removed -> user-written (click red text to restore)
```

### 4.3 localStorage Schema

```
Key: "cowrithink-session-{sessionId}"
Value: JSON.stringify(Session)

Key: "cowrithink-active-session"
Value: sessionId string
```

### 4.4 Non-Functional Requirements

| Attribute       | Target                                                    |
|-----------------|-----------------------------------------------------------|
| Editor responsiveness | Keypress-to-render < 16ms (60fps)                   |
| AI generation display | Skeleton appears within 100ms of request             |
| Session save latency  | Debounced write completes within 50ms                |
| Export file generation | < 500ms for sessions under 2 MB                     |
| Maximum session size  | 5 MB (with warning at 4 MB)                          |
| Browser support       | Chrome 120+, Firefox 120+, Safari 17+                |

---

## 5. Traceability

| Requirement   | Feature | Design Rationale |
|---------------|---------|------------------|
| REQ-CORE-001  | F1      | DR2 (Collaborative AI), DR5 (Low-effort intent) |
| REQ-CORE-002  | F1      | DR2, DR5 |
| REQ-CORE-003  | F1      | DR2, DR5 |
| REQ-CORE-007  | F2      | DR1 (Reliance awareness), DR4 (Fine-grained control) |
| REQ-CORE-009  | F2      | DR1, DR3 (Reflective space), DR4 |
| REQ-CORE-011  | F2      | DR3 (Force reflection, prevent autopilot acceptance) |
| REQ-CORE-013  | F7      | DR1 (Provenance data for awareness features) |
| REQ-CORE-016  | F7      | DR1 (Study data export) |
| REQ-CORE-019  | F9      | DR3 (Reflective space via side panel context) |
| REQ-CORE-022  | F10     | DR2 (Clear feedback during AI collaboration) |
