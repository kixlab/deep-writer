# CoWriThink

An AI-assisted writing tool designed to promote writer autonomy rather than passive AI consumption, built as a research prototype for controlled user studies.

## Key Features

- **Goal-driven writing sessions** -- Modal prompt at session start captures writing intent, with editable goal display throughout the session
- **7 distinct text states** -- Visual decorations distinguish user-written, AI-generated, AI-pending, user-edited, marked-preserve, marked-delete, and original-removed text
- **Inline diff system** -- Side-by-side original and AI replacement text rendered inline with click-to-restore and click-to-reject interactions
- **Provenance tracking** -- Every user interaction is logged as a typed event for research data collection and analysis
- **Session persistence** -- Debounced localStorage writes with automatic restore on page reload and JSON export for research data
- **Adaptive layout** -- 70/30 split editor and side panel with collapsible panel for focused writing
- **Loading state management** -- Skeleton placeholders and read-only editor during AI generation, with interactive side panel

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
| AI Provider      | OpenAI GPT-4o (stubbed)     | --      |
| Testing          | Vitest + Testing Library    | 3.x     |

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm

### Installation

```bash
npm install
```

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
  app/                    # Next.js App Router pages and layout
  components/
    goal/                 # Goal prompt modal, mode selector, goal display
    editor/               # TipTap editor wrapper, prompt bar, skeleton
    sidebar/              # Collapsible side panel with goal, history, outline
    layout/               # Split layout container and app header
    shared/               # Export button, storage warning
  extensions/
    TextStateExtension.ts # Custom TipTap mark for 7 text states
    ProvenancePlugin.ts   # Transaction-level event logging
    DiffDecorationPlugin.ts # Inline diff rendering with decorations
  stores/
    useSessionStore.ts    # Session lifecycle, goal, persistence
    useProvenanceStore.ts # Provenance event logging
    useEditorStore.ts     # Text states, diffs, read-only mode
    useLoadingStore.ts    # AI generation flags
    useLayoutStore.ts     # Side panel collapse state
  lib/
    storage.ts            # localStorage service with capacity monitoring
    export.ts             # Session export to JSON file
  types/
    session.ts            # Session, GoalChange type definitions
    provenance.ts         # ProvenanceEvent, EventType type definitions
    editor.ts             # TextState, DiffEntry, SegmentScore definitions
```

## Architecture

### Data Flow

```
User Input --> TipTap Editor --> Zustand Stores --> localStorage
                  |                    |
                  v                    v
          ProvenancePlugin       Session Export (JSON)
```

User interactions flow through the TipTap editor, which dispatches ProseMirror transactions. The ProvenancePlugin intercepts these transactions to log events. Zustand stores manage application state and persist to localStorage with debounced writes.

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

## Development Roadmap

| SPEC ID        | Title                             | Status    |
|----------------|-----------------------------------|-----------|
| SPEC-CORE-001  | Editor Foundation & Data Model    | Completed |
| SPEC-CORE-002  | Marking & AI Generation           | Planned   |
| SPEC-CORE-003  | Pushback & Process 2              | Planned   |
| SPEC-CORE-004  | Awareness Layer                   | Planned   |

## License

This is a research prototype developed for academic study. Not intended for production use.
