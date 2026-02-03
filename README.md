# CoWriThink

An AI-assisted writing tool designed to promote writer autonomy rather than passive AI consumption, built as a research prototype for controlled user studies.

## Key Features

### Editor Foundation

- **Goal-driven writing sessions** -- Modal prompt at session start captures writing intent, with editable goal display throughout the session
- **7 distinct text states** -- Visual decorations distinguish user-written, AI-generated, AI-pending, user-edited, marked-preserve, marked-delete, and original-removed text
- **Inline diff system** -- Side-by-side original and AI replacement text rendered inline with click-to-restore and click-to-reject interactions
- **Provenance tracking** -- Every user interaction is logged as a typed event for research data collection and analysis
- **Session persistence** -- Debounced localStorage writes with automatic restore on page reload and JSON export for research data
- **Adaptive layout** -- 70/30 split editor and side panel with collapsible panel for focused writing
- **Loading state management** -- Skeleton placeholders and read-only editor during AI generation, with interactive side panel

### Marking Interaction and AI Generation

- **Click-based selection granularity** -- Single click highlights a word immediately (no delay), double click selects a phrase, triple click selects a sentence; click handlers set visual decorations only, with no text state changes
- **AI alternatives tooltip** -- Drag-select any text in the plain editor to see 3-4 GPT-4o-generated alternative phrasings in a floating panel; click an alternative to replace the selected text instantly
- **Clause-level snap selection in diff view** -- Drag selection in the split diff view auto-expands to clause boundaries using phrase boundary detection, with Keep/Delete tooltip for accepting or rejecting clauses
- **Regenerate button** -- Collects all `marked-delete` segments as gaps, sends preserved text as constraints alongside the writing goal to OpenAI GPT-4o; disabled when no segments are marked
- **Inline diff display** -- AI replacements appear as inline diffs (original in red strikethrough, replacement in green highlight); each diff is resolved independently by clicking
- **Dual-mode prompt bar** -- Persistent input bar at the bottom of the editor with two modes: selection replacement (when text is selected) and cursor continuation (when no text is selected)
- **Server-side AI integration** -- OpenAI GPT-4o communication via Next.js route handlers at `/api/generate` and `/api/alternatives`, keeping the API key secure on the server side
- **Edge case handling** -- Regenerating with all text deleted generates a fresh draft from the writing goal; the Regenerate button stays disabled when no marks exist
- **Dark mode support** -- All tooltip and selection interaction styles adapt to both light and dark themes

## Technology Stack

| Component        | Technology                  | Version |
|------------------|-----------------------------|---------|
| Framework        | Next.js (App Router)        | 15      |
| UI Library       | React                       | 19      |
| Editor Engine    | TipTap (ProseMirror-based)  | 2.x     |
| State Management | Zustand                     | 5.x     |
| Styling          | Tailwind CSS                | 4.x     |
| Language         | TypeScript                  | 5.x     |
| Persistence      | localStorage (browser)      | --      |
| AI Provider      | OpenAI GPT-4o (server-side) | --      |
| Testing          | Vitest + Testing Library    | 3.x     |

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm
- An OpenAI API key with GPT-4o access

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env.local` file in the project root with your OpenAI API key:

```
OPENAI_API_KEY=sk-your-api-key-here
```

This key is used exclusively on the server side via the Next.js route handler at `/api/generate`. It is never exposed to the client browser.

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Testing

```bash
npm run test        # Watch mode
npm run test:run    # Single run
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
  app/
    api/
      generate/route.ts      # OpenAI GPT-4o server-side route handler for regeneration
      alternatives/route.ts  # Lightweight GPT-4o endpoint for alternative phrasings
    page.tsx                 # Main application page
    layout.tsx               # Root layout
    globals.css              # Global styles including marking, diff, and tooltip CSS
  components/
    goal/                    # Goal prompt modal, mode selector, goal display
    editor/
      CoWriThinkEditor.tsx   # TipTap editor wrapper with forwardRef and tooltip integration
      AlternativesTooltip.tsx # Floating panel for AI alternative suggestions on drag selection
      KeepDeleteTooltip.tsx  # Compact Keep/Delete tooltip for split diff view
      DiffSplitView.tsx      # Side-by-side diff view with clause-level snap selection
      DiffToolbar.tsx        # Toolbar controls for the diff view
      PromptBar.tsx          # Dual-mode AI prompt input (selection / continuation)
      RegenerateButton.tsx   # Regeneration trigger button
      SkeletonPlaceholder.tsx# Loading skeleton during generation
    sidebar/                 # Collapsible side panel with goal, history, outline
    layout/                  # Split layout container and app header
    shared/                  # Export button, storage warning
  extensions/
    TextStateExtension.ts    # Custom TipTap mark for 7 text states
    MarkingExtension.ts      # Click-based selection (word/phrase/sentence) and drag detection
    ProvenancePlugin.ts      # Transaction-level event logging
    DiffDecorationPlugin.ts  # Inline diff rendering with decorations
  hooks/
    useGeneration.ts         # React hook managing generation lifecycle
    useAlternatives.ts       # React hook for fetching AI alternative phrasings with abort control
    useSyncScroll.ts         # Synchronized scrolling for split diff panels
  services/
    generation.ts            # Document scanning, prompt construction, API calls
  stores/
    useSessionStore.ts       # Session lifecycle, goal, persistence
    useProvenanceStore.ts    # Provenance event logging
    useEditorStore.ts        # Text states, diffs, read-only mode
    useLoadingStore.ts       # AI generation flags
    useLayoutStore.ts        # Side panel collapse state
  lib/
    boundaries.ts            # Word, phrase, and sentence boundary detection
    diffCompute.ts           # Diff computation utilities for split view
    storage.ts               # localStorage service with capacity monitoring
    export.ts                # Session export to JSON file
    __tests__/
      boundaries.test.ts     # 22 boundary detection unit tests
  types/
    session.ts               # Session, GoalChange type definitions
    provenance.ts            # ProvenanceEvent, EventType type definitions
    generation.ts            # Generation pipeline interfaces (GapInfo, GenerateRequest, etc.)
    editor.ts                # TextState, DiffEntry, SegmentScore definitions
    index.ts                 # Consolidated type exports
```

## Architecture

### Data Flow

```
User Input --> TipTap Editor --> Zustand Stores --> localStorage
                  |                    |
                  v                    v
          ProvenancePlugin       Session Export (JSON)

Marking Flow:
  User Click --> MarkingExtension (word/phrase/sentence highlight) --> Visual Decoration
  User Drag --> MarkingExtension (drag detection) --> AlternativesTooltip --> /api/alternatives --> Replace Text

Regeneration Flow:
  Regenerate Button --> useGeneration Hook --> GenerationService (scan + prompt)
      --> /api/generate (server) --> OpenAI GPT-4o --> Parse Response
      --> Apply Inline Diffs --> User Resolves Diffs

Prompt Bar Flow:
  User Prompt --> Detect Mode (selection vs. continuation)
      --> GenerationService --> /api/generate --> Apply Result
```

User interactions flow through the TipTap editor, which dispatches ProseMirror transactions. The ProvenancePlugin intercepts these transactions to log events. Zustand stores manage application state and persist to localStorage with debounced writes.

The marking interaction adds a second layer: the MarkingExtension handles click-based selection (word on single click, phrase on double click, sentence on triple click) as visual decorations only. Drag selection triggers the `useAlternatives` hook, which fetches AI-generated alternative phrasings from `/api/alternatives` and displays them in the `AlternativesTooltip` for click-to-replace. In the split diff view, drag selection snaps to clause boundaries and presents Keep/Delete actions via the `KeepDeleteTooltip`. When the user triggers regeneration, the `useGeneration` hook orchestrates document scanning, prompt construction, server-side API calls, and inline diff application.

### Text State System

The editor tracks 7 distinct text states, each with a specific visual treatment:

| State              | Description                                      | Visual Treatment        |
|--------------------|--------------------------------------------------|-------------------------|
| `user-written`     | Text typed directly by the user                  | Default (no highlight)  |
| `ai-generated`     | Text produced by the AI and accepted by the user | Green highlight         |
| `ai-pending`       | AI replacement text awaiting user decision        | Green highlight in diff |
| `user-edited`      | AI text manually modified by the user            | Subtle underline        |
| `marked-preserve`  | Text explicitly marked to keep during regeneration | Green background      |
| `marked-delete`    | Text explicitly marked for removal               | Red strikethrough       |
| `original-removed` | Original text shown in diff view                 | Red strikethrough       |

### Provenance System

Every user interaction is recorded as a `ProvenanceEvent` with a unique ID, timestamp, event type, and data payload. The 11 event types cover the full interaction lifecycle:

- `text-typed` -- User keyboard input
- `ai-generation-requested` / `ai-generation-received` -- AI round-trip
- `mark-applied` -- Text state marking actions
- `edit-in-place` -- Direct text modification
- `pushback-shown` / `pushback-response` -- AI pushback interactions
- `process2-shown` / `process2-response` -- Process 2 interactions
- `awareness-toggled` -- Awareness layer toggle
- `goal-changed` -- Writing goal modification

This provenance data enables research analysis of writer-AI interaction patterns and reliance behaviors.

## API Reference

### POST /api/generate

Server-side route handler for AI text generation via OpenAI GPT-4o.

**Request Body:**

```json
{
  "goal": "string (required) - The user's writing goal",
  "document": "string (required) - Document text with [GAP:id] markers",
  "gaps": [
    {
      "id": "string",
      "position": { "from": 0, "to": 10 },
      "originalText": "string"
    }
  ],
  "constraints": [
    {
      "text": "string",
      "position": { "from": 0, "to": 10 }
    }
  ],
  "userRequest": "string (optional) - Natural language request from the prompt bar",
  "mode": "regenerate | selection | continuation"
}
```

**Success Response (200):**

```json
{
  "gaps": [
    { "id": "gap-id", "text": "generated text" }
  ]
}
```

**Error Response (4xx/5xx):**

```json
{
  "error": "Human-readable error message",
  "retryable": true
}
```

**Modes:**

- `regenerate` -- Fill gaps from marked-delete segments using surrounding context and the writing goal.
- `selection` -- Replace the user-selected text region based on the prompt bar request.
- `continuation` -- Generate continuation text at the cursor position based on the prompt bar request and surrounding context.

### POST /api/alternatives

Lightweight endpoint for generating alternative phrasings of selected text via OpenAI GPT-4o.

**Request Body:**

```json
{
  "selectedText": "string (required, max 500 chars) - The text to rephrase",
  "context": "string (optional) - Surrounding text for context",
  "goal": "string (optional) - Writing style guidance"
}
```

**Success Response (200):**

```json
{
  "alternatives": ["alternative 1", "alternative 2", "alternative 3"]
}
```

**Error Response (4xx/5xx):**

```json
{
  "error": "Human-readable error message",
  "retryable": true
}
```

**Details:**

- Uses GPT-4o with `max_tokens: 256` for fast response times
- 15-second request timeout
- Returns 3-4 alternative phrasings
- Selected text is limited to 500 characters

## Development Roadmap

| SPEC ID            | Title                             | Status    |
|--------------------|-----------------------------------|-----------|
| SPEC-CORE-001      | Editor Foundation & Data Model    | Completed |
| SPEC-INTERACT-001  | Marking & AI Generation           | Completed |
| SPEC-INTERACT-002  | Editor Interaction Redesign       | Completed |
| SPEC-GUARD-001     | Pushback System                   | Planned   |
| SPEC-PROC2-001     | Process 2 Objective Surfacing     | Planned   |
| SPEC-AWARE-001     | Awareness & Reliance Overlay      | Planned   |

## License

This is a research prototype developed for academic study. Not intended for production use.
