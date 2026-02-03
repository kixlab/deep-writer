---
spec_id: SPEC-CORE-001
title: "Editor Foundation & Data Model - Implementation Plan"
version: "1.0.0"
created: 2026-02-03
updated: 2026-02-03
author: Dr.WriThink
---

# SPEC-CORE-001: Implementation Plan

## 1. Technology Decision: TipTap over Raw ProseMirror

### Recommendation: TipTap v2

| Criterion               | TipTap v2                                    | Raw ProseMirror                              |
|--------------------------|----------------------------------------------|----------------------------------------------|
| API ergonomics           | High-level React bindings, declarative        | Low-level imperative API                      |
| Custom decorations       | Supported via extensions and DecorationSet    | Full control, but verbose setup               |
| React 19 compatibility   | Supported via @tiptap/react                   | Requires manual integration                   |
| Learning curve           | Moderate (good docs, active community)        | Steep (sparse docs, niche community)          |
| Custom node/mark types   | Extension API makes this straightforward      | Powerful but requires deep PM knowledge       |
| Diff view support        | DecorationSet API for overlay decorations     | Same underlying API                           |
| Prototype velocity       | High -- less boilerplate, faster iteration    | Low -- every feature built from scratch       |
| Escape hatch             | Full ProseMirror access when needed           | N/A -- already at the lowest level            |

**Decision**: Use TipTap v2 with @tiptap/react for rapid prototype development. Fall back to raw ProseMirror plugin API only for the diff decoration layer if TipTap decorations prove insufficient.

### Key Libraries

| Library                    | Purpose                                       | Version   |
|----------------------------|-----------------------------------------------|-----------|
| @tiptap/react              | React integration for TipTap                  | ^2.11.x   |
| @tiptap/starter-kit        | Base editor features (bold, italic, etc.)     | ^2.11.x   |
| @tiptap/pm                 | ProseMirror core access for custom plugins    | ^2.11.x   |
| zustand                    | Client-side state management                  | ^5.x      |
| nanoid                     | Lightweight unique ID generation              | ^5.x      |
| tailwindcss                | Utility-first CSS framework                   | ^4.x      |
| openai                     | OpenAI API client                             | ^4.x      |
| next                       | Application framework                         | ^15.x     |

---

## 2. Component Architecture

### 2.1 Page Structure

```
app/
  page.tsx                   -- Entry point, session initialization
  layout.tsx                 -- Root layout with metadata

components/
  goal/
    GoalModal.tsx            -- Session start modal with goal input
    StartModeSelector.tsx    -- "Start from scratch" / "Generate AI first draft"
    GoalDisplay.tsx          -- Collapsed/expandable goal in header

  editor/
    EditorContainer.tsx      -- Main editor wrapper (70% width)
    CoWriThinkEditor.tsx     -- TipTap editor instance and configuration
    DiffOverlay.tsx          -- ProseMirror decoration plugin for diff view
    TextStateDecorations.tsx -- Decoration plugin for 7 text states
    SkeletonPlaceholder.tsx  -- Pulsing gray placeholder during AI generation
    PromptBar.tsx            -- Bottom prompt input bar

  sidebar/
    SidePanel.tsx            -- Collapsible side panel container (30% width)
    SidePanelGoal.tsx        -- Editable goal section
    PushbackComments.tsx     -- Active pushback warning list
    RoundHistory.tsx         -- Chronological round list with reliance dots
    DocumentOutline.tsx      -- Auto-generated paragraph summaries

  layout/
    AppHeader.tsx            -- Top bar with title, goal, reliance indicator
    SplitLayout.tsx          -- 70/30 responsive split layout

  shared/
    LoadingSpinner.tsx       -- Reusable spinner component
    ExportButton.tsx         -- "Export Session" button
    StorageWarning.tsx       -- localStorage limit notification
    ErrorNotification.tsx    -- Non-blocking error toast
```

### 2.2 TipTap Extension Architecture

```
extensions/
  TextStateExtension.ts     -- Custom Mark for tracking 7 text states
  DiffDecorationPlugin.ts   -- ProseMirror Plugin for inline diff rendering
  ReadOnlyPlugin.ts         -- Toggle read-only mode during AI generation
  ProvenancePlugin.ts       -- Transaction listener that logs provenance events
```

---

## 3. State Management (Zustand)

### 3.1 Store Architecture

```
stores/
  useSessionStore.ts         -- Session, goal, goalHistory, persistence
  useEditorStore.ts          -- Editor state, text states, diff tracking
  useProvenanceStore.ts      -- Provenance event log, event dispatch
  useLayoutStore.ts          -- Side panel open/closed, active section
  useLoadingStore.ts         -- AI generation in-progress flags
```

### 3.2 Store Definitions

**useSessionStore**
- `session: Session | null` -- Current session object
- `initSession(goal: string): void` -- Create new session with goal
- `updateGoal(newGoal: string, source: GoalChangeSource): void` -- Update goal and append to history
- `getExportData(): Session` -- Serialize full session for JSON export
- `persistToStorage(): void` -- Debounced localStorage write
- `loadFromStorage(): Session | null` -- Hydrate from localStorage
- `checkStorageUsage(): { used: number, limit: number, percentage: number }` -- Monitor capacity

**useEditorStore**
- `textStates: Map<string, TextState>` -- Segment ID to text state mapping
- `activeDiffs: DiffEntry[]` -- Currently visible diffs
- `isReadOnly: boolean` -- Editor read-only flag during generation
- `setTextState(segmentId: string, state: TextState): void`
- `addDiff(original: string, replacement: string, position: number): void`
- `resolveDiff(diffId: string, action: 'accept' | 'reject' | 'restore'): void`

**useProvenanceStore**
- `events: ProvenanceEvent[]` -- All logged events
- `logEvent(type: EventType, data: Record<string, unknown>): void` -- Append event with auto-generated ID and timestamp
- `getEventsByType(type: EventType): ProvenanceEvent[]` -- Filter events
- `getEventCount(): number` -- Total event count

**useLayoutStore**
- `isSidePanelOpen: boolean`
- `toggleSidePanel(): void`

**useLoadingStore**
- `isGenerating: boolean`
- `generationStartTime: number | null`
- `setGenerating(value: boolean): void`

---

## 4. Implementation Milestones

### Milestone 1: Core Data Layer (Primary Goal)

**Priority: High**

| Task | Description | Files |
|------|-------------|-------|
| T-001 | Define TypeScript types for Session, ProvenanceEvent, SegmentScore, GoalChange, TextState | `types/session.ts`, `types/provenance.ts`, `types/editor.ts` |
| T-002 | Implement useSessionStore with localStorage persistence and debounced writes | `stores/useSessionStore.ts` |
| T-003 | Implement useProvenanceStore with event logging and filtering | `stores/useProvenanceStore.ts` |
| T-004 | Implement localStorage service layer with capacity monitoring and error handling | `lib/storage.ts` |
| T-005 | Implement session export as JSON download | `lib/export.ts` |

### Milestone 2: Goal Prompt Flow (Primary Goal)

**Priority: High**

| Task | Description | Files |
|------|-------------|-------|
| T-006 | Build GoalModal component with text input, validation, and placeholder | `components/goal/GoalModal.tsx` |
| T-007 | Build StartModeSelector component with two-button choice | `components/goal/StartModeSelector.tsx` |
| T-008 | Build GoalDisplay component (collapsed/expandable in header) | `components/goal/GoalDisplay.tsx` |
| T-009 | Wire goal flow: modal -> mode selection -> editor initialization | `app/page.tsx` |
| T-010 | Implement goal editing in side panel with provenance logging | `components/sidebar/SidePanelGoal.tsx` |

### Milestone 3: Editor Foundation (Primary Goal)

**Priority: High**

| Task | Description | Files |
|------|-------------|-------|
| T-011 | Set up TipTap editor with base extensions (StarterKit) | `components/editor/CoWriThinkEditor.tsx` |
| T-012 | Create TextStateExtension custom TipTap mark for 7 text states | `extensions/TextStateExtension.ts` |
| T-013 | Implement decoration rendering: green highlight, red strikethrough, underline, green background | `extensions/TextStateExtension.ts` |
| T-014 | Create DiffDecorationPlugin for inline diff view (original + replacement side-by-side) | `extensions/DiffDecorationPlugin.ts` |
| T-015 | Implement diff interaction: click-to-restore, click-to-reject, double-click-to-edit | `extensions/DiffDecorationPlugin.ts` |
| T-016 | Create ProvenancePlugin to log editor transactions as provenance events | `extensions/ProvenancePlugin.ts` |
| T-017 | Implement useEditorStore for text state tracking and diff management | `stores/useEditorStore.ts` |

### Milestone 4: Layout and Loading (Secondary Goal)

**Priority: Medium**

| Task | Description | Files |
|------|-------------|-------|
| T-018 | Build SplitLayout component with 70/30 split and panel toggle | `components/layout/SplitLayout.tsx` |
| T-019 | Build AppHeader with title, goal display, and reliance indicator slot | `components/layout/AppHeader.tsx` |
| T-020 | Build SidePanel container with collapsible behavior | `components/sidebar/SidePanel.tsx` |
| T-021 | Build side panel sections: PushbackComments, RoundHistory, DocumentOutline | `components/sidebar/*.tsx` |
| T-022 | Build SkeletonPlaceholder with pulsing animation | `components/editor/SkeletonPlaceholder.tsx` |
| T-023 | Build PromptBar with input, send button, and loading indicator | `components/editor/PromptBar.tsx` |
| T-024 | Implement useLoadingStore and read-only mode toggle during generation | `stores/useLoadingStore.ts` |

### Milestone 5: Integration and Polish (Final Goal)

**Priority: Medium**

| Task | Description | Files |
|------|-------------|-------|
| T-025 | Integrate all stores with editor: state transitions fire provenance events | Integration across stores |
| T-026 | Build ExportButton that triggers full session JSON download | `components/shared/ExportButton.tsx` |
| T-027 | Build StorageWarning notification for 80% capacity threshold | `components/shared/StorageWarning.tsx` |
| T-028 | End-to-end flow test: goal -> editor -> text states -> provenance -> export | Manual integration testing |

---

## 5. Architecture Design Direction

### 5.1 Data Flow

```
User Input (typing/clicking)
    |
    v
TipTap Editor (ProseMirror transactions)
    |
    +---> TextStateExtension (updates text state marks)
    |
    +---> ProvenancePlugin (logs interaction events)
    |
    +---> DiffDecorationPlugin (manages diff overlays)
    |
    v
Zustand Stores
    |
    +---> useEditorStore (text states, diffs)
    +---> useProvenanceStore (event log)
    +---> useSessionStore (session, goal, persistence)
    |
    v
localStorage (debounced persistence)
```

### 5.2 Editor Read-Only During Generation

When AI generation is in progress:
1. `useLoadingStore.isGenerating` set to `true`
2. TipTap editor receives `editable: false`
3. SkeletonPlaceholder rendered at insertion point
4. PromptBar shows progress indicator, Regenerate button disabled
5. Side panel remains interactive (separate React tree, no read-only coupling)

### 5.3 Diff Rendering Strategy

Diffs are rendered as ProseMirror Decorations (not as document nodes) to avoid polluting the document model:
- Original text: `Decoration.inline` with red strikethrough CSS class
- AI replacement: `Decoration.widget` rendered after the original span
- Click handlers attached to decoration DOM elements
- Upon resolution, decorations are removed and document model is updated atomically

---

## 6. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| TipTap decoration conflicts when multiple text states overlap on same span | Medium | High | Use ProseMirror marks (not decorations) for persistent states; reserve decorations for transient diff overlays only |
| localStorage quota exceeded during long sessions | Low | Medium | Implement proactive storage monitoring (REQ-CORE-017), warn at 80%, offer export |
| ProseMirror transaction performance degrades with large provenance logs | Low | Medium | Keep provenance log in separate Zustand store (not in ProseMirror state); debounce logging for rapid typing |
| Diff view complexity with multiple unresolved diffs coexisting | Medium | Medium | Track each diff independently with unique IDs; visual grouping to prevent user confusion |
| React 19 + TipTap v2 compatibility issues | Low | High | Pin TipTap versions; test early in Milestone 3. Fallback: use TipTap v2.9.x known-stable release |
| OpenAI API latency exceeds user patience threshold | Medium | Medium | Implement streaming response (REQ-CORE-025); show skeleton immediately; allow cancel |

---

## 7. Dependencies on External Libraries

| Dependency | Purpose | Critical Path | Fallback |
|------------|---------|---------------|----------|
| @tiptap/react | Editor React bindings | Yes (Milestone 3) | Raw ProseMirror + custom React wrapper |
| @tiptap/starter-kit | Base editor features | Yes (Milestone 3) | Cherry-pick individual ProseMirror plugins |
| zustand | State management | Yes (Milestone 1) | React Context + useReducer |
| openai | GPT-4o API client | No (not in CORE-001 scope) | Direct fetch to API endpoint |
| nanoid | Unique ID generation | Yes (Milestone 1) | crypto.randomUUID() |
| tailwindcss | Styling | Yes (all milestones) | CSS modules |

---

## 8. Out of Scope for SPEC-CORE-001

The following features are explicitly deferred to subsequent SPECs:

| Feature | Deferred To | Reason |
|---------|-------------|--------|
| Marking interaction (progressive granularity, toggle behavior) | SPEC-CORE-002 | Depends on text state foundation from this SPEC |
| AI generation and regeneration logic | SPEC-CORE-002 | Depends on editor + provenance foundation |
| Pushback system (guarded compliance) | SPEC-CORE-003 | Depends on AI generation pipeline |
| Process 2 (objective surfacing) | SPEC-CORE-003 | Depends on goal + provenance systems |
| Awareness layer (reliance assessment) | SPEC-CORE-004 | Depends on provenance store from this SPEC |
| Prompt bar AI integration | SPEC-CORE-002 | Only layout/shell is in scope here |

---

## Traceability

| Task    | Requirement   | Milestone |
|---------|---------------|-----------|
| T-001   | REQ-CORE-014  | M1        |
| T-002   | REQ-CORE-015  | M1        |
| T-003   | REQ-CORE-013  | M1        |
| T-004   | REQ-CORE-017, REQ-CORE-018 | M1 |
| T-005   | REQ-CORE-016  | M1        |
| T-006   | REQ-CORE-002, REQ-CORE-005 | M2 |
| T-007   | REQ-CORE-003  | M2        |
| T-008   | REQ-CORE-001  | M2        |
| T-009   | REQ-CORE-002, REQ-CORE-003 | M2 |
| T-010   | REQ-CORE-004, REQ-CORE-006 | M2 |
| T-011   | REQ-CORE-007  | M3        |
| T-012   | REQ-CORE-007, REQ-CORE-008 | M3 |
| T-013   | REQ-CORE-007  | M3        |
| T-014   | REQ-CORE-009  | M3        |
| T-015   | REQ-CORE-010, REQ-CORE-011 | M3 |
| T-016   | REQ-CORE-013  | M3        |
| T-017   | REQ-CORE-008  | M3        |
| T-018   | REQ-CORE-019, REQ-CORE-020 | M4 |
| T-019   | REQ-CORE-001  | M4        |
| T-020   | REQ-CORE-020, REQ-CORE-021 | M4 |
| T-021   | REQ-CORE-021  | M4        |
| T-022   | REQ-CORE-022  | M4        |
| T-023   | REQ-CORE-022  | M4        |
| T-024   | REQ-CORE-022, REQ-CORE-023, REQ-CORE-024 | M4 |
| T-025   | All           | M5        |
| T-026   | REQ-CORE-016  | M5        |
| T-027   | REQ-CORE-017  | M5        |
