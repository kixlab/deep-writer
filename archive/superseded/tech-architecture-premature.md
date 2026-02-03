# CoWriThink: Technical Architecture

Prototype architecture for the workshop paper evaluation.

---

## Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Frontend** | Next.js (React) | Rich ecosystem, Tiptap compatibility, Vercel deployment |
| **Editor** | Tiptap (ProseMirror) | Best for custom inline marks/decorations at word level |
| **LLM** | OpenAI GPT-4o | Strong writing quality, good constraint-following |
| **Deployment** | Vercel (serverless) | Zero infra management, API routes built in |
| **Storage** | Local storage + JSON export | Simplest for prototype; no backend DB needed |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │              Tiptap Editor                    │   │
│  │  ┌────────────┐ ┌──────────┐ ┌────────────┐ │   │
│  │  │  Marking   │ │  Diff    │ │  Awareness │ │   │
│  │  │  Extension │ │  Display │ │  Overlay   │ │   │
│  │  └────────────┘ └──────────┘ └────────────┘ │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │  Provenance  │  │  Session     │                 │
│  │  Store       │  │  State       │                 │
│  │  (localStorage) (localStorage) │                 │
│  └──────────────┘  └──────────────┘                 │
│                                                     │
└──────────────────┬──────────────────────────────────┘
                   │ API calls
                   ▼
┌─────────────────────────────────────────────────────┐
│           Vercel Serverless Functions               │
│                                                     │
│  /api/generate     → AI text generation             │
│  /api/pushback     → Guarded compliance check       │
│  /api/objective    → Process 2 misalignment detect  │
│                                                     │
│           ┌──────────────┐                          │
│           │  OpenAI API  │                          │
│           │  (GPT-4o)    │                          │
│           └──────────────┘                          │
└─────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Tiptap Editor Core

The editor is the central UI. Three custom extensions:

**Marking Extension**
- Custom ProseMirror plugin that tracks word/phrase/sentence boundaries
- Click handler: first click selects word, second expands to phrase, third to sentence
- Each node/mark stores state: `preserved` | `deleted` | `edited`
- Decorations: green background (preserved), red strikethrough (deleted), blue (user-written)

**Diff Display Extension**
- Renders AI output inline with diff highlighting
- Original text: red strikethrough
- AI replacement: green highlight
- Uses ProseMirror decorations, not actual marks (non-destructive)

**Awareness Overlay Extension**
- Toggleable decoration layer
- Colors text by authorship: blue (user), purple (negotiated), gray (AI-accepted)
- Reads from provenance store

### 2. Provenance Store

Client-side data model stored in localStorage.

```typescript
interface ProvenanceEntry {
  id: string
  spanStart: number          // document position start
  spanEnd: number            // document position end
  text: string
  authorship: 'user' | 'ai' | 'negotiated'
  action: 'typed' | 'preserved' | 'deleted' | 'edited'
  timestamp: number
  round: number              // which marking round
}

interface SessionState {
  goal: string
  documentId: string
  entries: ProvenanceEntry[]
  markingRounds: number
  relianceScore: number      // computed: % user-authored or edited
}
```

**Export:** Button to download full session as JSON for study analysis.

### 3. API Routes

**`/api/generate`**
- Input: current document, preserved segments, deleted segments, user goal
- Prompt: "Generate text that fills the gaps left by deleted segments. You MUST preserve all segments marked as preserved. Respect the writing goal: {goal}"
- Output: new text for deleted regions only

**`/api/pushback`**
- Input: user's marks, current document, user goal
- Prompt: "Review these editing decisions. Flag any that: (1) contradict the writing goal, (2) break structural coherence (e.g., removing a key premise), (3) preserve low-quality text that should be improved. For each flag, explain why in 1-2 sentences and suggest an alternative."
- Output: list of flagged segments with explanations

**`/api/objective`**
- Input: current document, user goal, recent marking history
- Prompt: "Compare the current document direction with the stated goal. If there is misalignment or emerging contradiction, describe it and suggest 2-3 alternative directions."
- Output: misalignment description + suggested directions (or null if aligned)

### 4. Goal Prompt UI

Simple modal on session start:
- Text input for writing goal (required)
- Two buttons: "Start from scratch" / "Generate AI first draft"
- Goal stored in session state, passed to all API calls

### 5. Reliance Indicator

Always-on component in top-right:
- Computed from provenance store: `(user + negotiated segments) / total segments`
- Renders as a small bar + percentage
- Click toggles the awareness overlay on/off

### 6. Notification Bar (Process 2)

Bottom bar component:
- Hidden by default
- Shown when `/api/objective` returns misalignment
- Displays description + clickable option buttons
- On selection: updates session goal, triggers regeneration

### 7. Pushback Tooltip

Floating component:
- Triggered when `/api/pushback` flags a segment
- Positions near the flagged segment
- Shows explanation + "Keep anyway" / "Accept suggestion" buttons
- Orange highlight on flagged segment via Tiptap decoration

---

## Data Flow

### Process 1 Loop

```
User clicks word → Marking Extension toggles state
  → if enough marks accumulated, user clicks "Regenerate"
    → client sends marks + doc to /api/pushback
      → if flags returned → show Pushback Tooltips
      → user resolves flags (keep/accept)
    → client sends final marks + doc to /api/generate
      → AI returns new text for deleted regions
      → Diff Display shows result
      → Provenance Store logs all changes
      → Reliance Indicator recalculates
    → user reviews → marks again → loop
```

### Process 2

```
After each regeneration round:
  → client sends doc + goal + history to /api/objective
  → if misalignment detected → show Notification Bar
  → user selects direction (or dismisses)
  → if selected → update session goal → continue
```

---

## File Structure

```
cowrithink/
├── app/
│   ├── page.tsx                    # Main editor page
│   ├── layout.tsx                  # App layout
│   └── api/
│       ├── generate/route.ts       # AI generation endpoint
│       ├── pushback/route.ts       # Guarded compliance endpoint
│       └── objective/route.ts      # Misalignment detection endpoint
├── components/
│   ├── Editor.tsx                  # Tiptap editor wrapper
│   ├── GoalPrompt.tsx             # Session start modal
│   ├── RelianceIndicator.tsx      # Always-on bar + percentage
│   ├── AwarenessOverlay.tsx       # Color overlay toggle
│   ├── NotificationBar.tsx        # Process 2 UI
│   ├── PushbackTooltip.tsx        # Guarded compliance tooltip
│   └── ExportButton.tsx           # JSON export for study
├── extensions/
│   ├── marking.ts                 # Tiptap marking extension
│   ├── diff-display.ts            # Inline diff rendering
│   └── awareness.ts               # Authorship overlay
├── lib/
│   ├── provenance.ts              # Provenance store (localStorage)
│   ├── session.ts                 # Session state management
│   ├── reliance.ts                # Reliance score computation
│   └── openai.ts                  # OpenAI API client
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.local                     # OPENAI_API_KEY
```

---

## Key Implementation Notes

- **Progressive granularity** (word → phrase → sentence) requires sentence/phrase boundary detection. Use a simple heuristic: phrases split by punctuation/conjunctions, sentences by periods/question marks.
- **Pushback call** should run in parallel with generation prep -- don't wait for pushback before showing the user the option to regenerate. Show pushback warnings inline as they arrive.
- **Provenance positions** will shift as text changes. Use ProseMirror's mapping system to keep positions in sync across edits.
- **Export format** should include full provenance log + session metadata + final document state for study analysis.

---

## Design Decisions Log

| # | Decision | Chosen |
|---|----------|--------|
| 1 | System name | CoWriThink |
| 2 | Frontend | Next.js (React) |
| 3 | Editor library | Tiptap (ProseMirror) |
| 4 | LLM | OpenAI GPT-4o |
| 5 | Deployment | Vercel (serverless) |
| 6 | Storage | Local storage + JSON export |
| 7 | Backend | Vercel API routes (serverless functions) |
