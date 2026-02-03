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

- **Progressive granularity selection** -- Click-based text selection that expands from word to phrase to sentence level on successive clicks within the same region
- **Toggle marking** -- Single click marks text for deletion (red strikethrough); clicking marked text toggles it back to unmarked; preserved text can be toggled to deleted
- **Edit mode** -- Double-click any text segment to enter inline edit mode; press Escape or click outside to exit; changes are tracked as `user-edited`
- **Regenerate button** -- Collects all `marked-delete` segments as gaps, sends preserved text as constraints alongside the writing goal to OpenAI GPT-4o; disabled when no segments are marked
- **Inline diff display** -- AI replacements appear as inline diffs (original in red strikethrough, replacement in green highlight); each diff is resolved independently by clicking
- **Dual-mode prompt bar** -- Persistent input bar at the bottom of the editor with two modes: selection replacement (when text is selected) and cursor continuation (when no text is selected)
- **Server-side AI integration** -- OpenAI GPT-4o communication via Next.js route handler at `/api/generate`, keeping the API key secure on the server side
- **Edge case handling** -- Regenerating with all text deleted generates a fresh draft from the writing goal; the Regenerate button stays disabled when no marks exist

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
    api/generate/route.ts    # OpenAI GPT-4o server-side route handler
    page.tsx                 # Main application page
    layout.tsx               # Root layout
    globals.css              # Global styles including marking and diff CSS
  components/
    goal/                    # Goal prompt modal, mode selector, goal display
    editor/
      CoWriThinkEditor.tsx   # TipTap editor wrapper with forwardRef
      PromptBar.tsx          # Dual-mode AI prompt input (selection / continuation)
      RegenerateButton.tsx   # Regeneration trigger button
      SkeletonPlaceholder.tsx# Loading skeleton during generation
    sidebar/                 # Collapsible side panel with goal, history, outline
    layout/                  # Split layout container and app header
    shared/                  # Export button, storage warning
  extensions/
    TextStateExtension.ts    # Custom TipTap mark for 7 text states
    MarkingExtension.ts      # Progressive granularity selection, toggle marking, edit mode
    ProvenancePlugin.ts      # Transaction-level event logging
    DiffDecorationPlugin.ts  # Inline diff rendering with decorations
  hooks/
    useGeneration.ts         # React hook managing generation lifecycle
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
  User Click --> MarkingExtension (granularity detection) --> Toggle Mark --> Provenance Event

Regeneration Flow:
  Regenerate Button --> useGeneration Hook --> GenerationService (scan + prompt)
      --> /api/generate (server) --> OpenAI GPT-4o --> Parse Response
      --> Apply Inline Diffs --> User Resolves Diffs

Prompt Bar Flow:
  User Prompt --> Detect Mode (selection vs. continuation)
      --> GenerationService --> /api/generate --> Apply Result
```

User interactions flow through the TipTap editor, which dispatches ProseMirror transactions. The ProvenancePlugin intercepts these transactions to log events. Zustand stores manage application state and persist to localStorage with debounced writes.

The marking interaction adds a second layer: the MarkingExtension handles progressive granularity click detection (word, phrase, sentence) and toggle marking. When the user triggers regeneration, the `useGeneration` hook orchestrates document scanning, prompt construction, server-side API calls, and inline diff application.

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

## Development Roadmap

| SPEC ID            | Title                             | Status    |
|--------------------|-----------------------------------|-----------|
| SPEC-CORE-001      | Editor Foundation & Data Model    | Completed |
| SPEC-INTERACT-001  | Marking & AI Generation           | Completed |
| SPEC-GUARD-001     | Pushback System                   | Planned   |
| SPEC-PROC2-001     | Process 2 Objective Surfacing     | Planned   |
| SPEC-AWARE-001     | Awareness & Reliance Overlay      | Planned   |

## License

This is a research prototype developed for academic study. Not intended for production use.
