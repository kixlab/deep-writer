# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
