# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (SPEC-INTERACT-001: Marking Interaction and AI Generation)

- Progressive granularity selection via MarkingExtension: click-based text selection expanding from word to phrase to sentence level within the TipTap editor
- Word, phrase, and sentence boundary detection utilities (`src/lib/boundaries.ts`) operating on the ProseMirror document model, with 22 unit tests
- Toggle marking behavior: single click marks text as `marked-delete` (red strikethrough), clicking marked text toggles it back to unmarked, preserved text can be toggled to deleted
- Edit mode via double-click: double-clicking any text segment enters inline editing with the sentence as the edit region; changes tracked as `user-edited`
- Regenerate button component (`src/components/editor/RegenerateButton.tsx`) that scans the document for `marked-delete` gaps, sends preserved text as constraints alongside the writing goal, and is disabled when no segments are marked
- OpenAI GPT-4o server-side integration via Next.js App Router route handler at `src/app/api/generate/route.ts`, protecting the API key from client-side exposure
- Structured prompt construction: document context with `[GAP:id]` markers, preserved text constraints, writing goal, and user request text
- Response parsing with JSON extraction fallback for robustness against prose-wrapped API responses
- Request validation, timeout handling (30 seconds), and structured error responses with retry indicators for rate limits, network errors, and parse failures
- Generation service module (`src/services/generation.ts`) for document scanning, gap/constraint collection, prompt construction, and API communication
- `useGeneration` React hook (`src/hooks/useGeneration.ts`) managing the full generation lifecycle: idle, loading, error, and complete states
- Dual-mode prompt bar: selection mode replaces the selected text region via inline diff; continuation mode inserts AI-generated text at the cursor position with `ai-generated` mark
- Inline diff display for AI replacements showing original text (red strikethrough) alongside replacement (green highlight), resolved independently by clicking
- Loading state management during generation: skeleton placeholders in gap regions, spinner on the Regenerate button, loading indicator in the prompt bar, and read-only editor mode
- Edge case handling: regenerating when all text is deleted generates a fresh draft from the writing goal; Regenerate button stays disabled when no marks exist
- Generation pipeline TypeScript interfaces (`src/types/generation.ts`): GapInfo, ConstraintInfo, GenerateMode, GenerateRequest, GenerateResponse, GenerateError
- New provenance event types: `prompt-request` and `diff-resolved` added to the event type union
- Editor exposed via `forwardRef` in `CoWriThinkEditor` for external access by the generation hook and page-level orchestration
- CSS styles for marking selection levels (word, phrase, sentence) and edit mode visual treatment

## [0.1.0] - 2026-02-03

### Added

- Goal prompt modal displayed on session start with text input and validation
- Start mode selection: "Start from scratch" and "Generate AI first draft"
- Collapsible goal display in the application header
- Goal editing with provenance logging (manual change source tracking)
- TipTap-based rich text editor with ProseMirror foundation
- Custom TextStateExtension supporting 7 text states: user-written, ai-generated, ai-pending, user-edited, marked-preserve, marked-delete, original-removed
- Distinct visual decorations for each text state (green highlights, red strikethrough, underlines)
- Inline diff rendering via DiffDecorationPlugin using ProseMirror decorations
- Click-to-restore interaction on original (red strikethrough) text in diffs
- Click-to-reject interaction on AI replacement (green highlight) text in diffs
- ProvenancePlugin for transaction-level event logging
- Provenance store logging 11 event types: text-typed, ai-generation-requested, ai-generation-received, mark-applied, edit-in-place, pushback-shown, pushback-response, process2-shown, process2-response, awareness-toggled, goal-changed
- Session data structure with goal, goalHistory, documentState, provenanceLog, and relianceScores
- Debounced localStorage persistence with 300ms write delay
- Session restore on page reload from localStorage
- Session export as JSON file download
- Storage capacity monitoring with 80% usage warning notification
- 70/30 split layout with editor and collapsible side panel
- Side panel sections: Goal (editable), Pushback Comments (stub), Round History (stub), Document Outline (stub)
- Application header with project title, goal display, and export button
- Skeleton placeholder during AI generation loading states
- Read-only editor mode during AI generation
- Interactive side panel during loading states
- Progress indicators for AI generation
- Prompt bar component for AI text generation input
- Storage warning component for localStorage limit notifications
- Zustand stores: useSessionStore, useProvenanceStore, useEditorStore, useLoadingStore, useLayoutStore
- localStorage service with capacity estimation and error handling
- Export service for session JSON file generation
- TypeScript type definitions for Session, ProvenanceEvent, TextState, DiffEntry, and SegmentScore
- Test suite with 107 passing tests across 7 test suites covering stores and services
