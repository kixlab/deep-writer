---
spec_id: SPEC-CORE-001
title: "Editor Foundation & Data Model - Acceptance Criteria"
version: "1.0.0"
created: 2026-02-03
updated: 2026-02-03
author: Dr.WriThink
---

# SPEC-CORE-001: Acceptance Criteria

## 1. Goal Prompt Flow

### AC-001: Goal Modal Appears on Session Start

```gherkin
Scenario: New session displays goal modal
  Given the user opens the application for the first time
  When the application finishes loading
  Then a modal dialog shall be displayed with the heading "What are you writing?"
  And the modal shall contain a text input field
  And the text input shall display a placeholder: "An argumentative essay about whether AI should be used in education..."
  And a submit button shall be present
  And the editor shall not be visible behind the modal
```

### AC-002: Blank Goal is Blocked

```gherkin
Scenario: User attempts to submit an empty goal
  Given the goal modal is displayed
  When the user leaves the goal input empty and clicks the submit button
  Then the modal shall remain open
  And a validation message shall indicate that a goal is required

Scenario: User attempts to submit a whitespace-only goal
  Given the goal modal is displayed
  When the user enters "   " (whitespace only) and clicks the submit button
  Then the modal shall remain open
  And a validation message shall indicate that a goal is required
```

### AC-003: Start Mode Selection After Goal

```gherkin
Scenario: User submits a valid goal and sees start options
  Given the goal modal is displayed
  When the user enters "An argumentative essay about AI in education" and submits
  Then the goal modal shall dismiss
  And the system shall display two buttons: "Start from scratch" and "Generate AI first draft"

Scenario: User chooses to start from scratch
  Given the start mode selection is displayed
  When the user clicks "Start from scratch"
  Then the editor shall appear with an empty document
  And the goal shall be displayed in the header in collapsed form
  And the side panel shall be visible with the goal section populated

Scenario: User chooses AI first draft
  Given the start mode selection is displayed
  When the user clicks "Generate AI first draft"
  Then a loading skeleton shall appear in the editor area
  And the system shall request AI generation based on the submitted goal
  And upon completion, the generated text shall appear in the editor with `ai-generated` state
```

### AC-004: Goal Display in Header

```gherkin
Scenario: Goal is persistently visible in collapsed form
  Given the user has set a goal and entered the editor
  When the user is writing in the editor
  Then the header shall display a truncated version of the goal text
  And an expand/collapse indicator shall be visible

Scenario: User expands the goal display
  Given the goal is displayed in collapsed form in the header
  When the user clicks the goal display area
  Then the full goal text shall become visible
  And clicking again shall collapse it
```

### AC-005: Goal Manual Edit

```gherkin
Scenario: User edits the goal from the side panel
  Given the editor is active with a goal set to "Essay about AI"
  When the user clicks the edit control in the side panel Goal section
  And changes the goal to "Research paper about AI writing tools"
  And confirms the edit
  Then the displayed goal shall update to "Research paper about AI writing tools"
  And a provenance event of type "goal-changed" shall be logged
  And the event data shall include source: "manual", previousGoal: "Essay about AI", newGoal: "Research paper about AI writing tools"
  And the goalHistory array shall contain the change entry
```

---

## 2. Text State Rendering

### AC-006: Seven Text States Display Correctly

```gherkin
Scenario: User-written text has no highlight
  Given the user has typed text directly into the editor
  When the text is rendered
  Then the text shall have no background highlight and no special decoration

Scenario: AI-generated text has green highlight
  Given AI has generated text that the user has accepted
  When the text is rendered
  Then the text shall have a green background highlight

Scenario: AI-pending text has green highlight in diff view
  Given AI has just generated replacement text
  When the diff view is displayed
  Then the AI replacement text shall have a green highlight
  And it shall be visually distinct as pending (not yet accepted)

Scenario: User-edited text has subtle underline
  Given the user double-clicks on AI-generated text and edits it
  When the user exits edit mode
  Then the modified text shall display with a subtle underline or border decoration
  And the text state shall be "user-edited"

Scenario: Marked-preserve text has green background
  Given text has been explicitly marked as preserve by the user
  When the text is rendered
  Then the text shall have a green background fill

Scenario: Marked-delete text has red strikethrough
  Given text has been explicitly marked as delete by the user
  When the text is rendered
  Then the text shall display with red strikethrough styling

Scenario: Original-removed text has red strikethrough in diff
  Given AI has proposed a replacement for existing text
  When the diff view is displayed
  Then the original text shall display with red strikethrough styling
  And it shall be adjacent to the green-highlighted AI replacement
```

---

## 3. Diff Display Behavior

### AC-007: Diff Shows Original and Replacement Inline

```gherkin
Scenario: AI generation creates inline diff
  Given the user has marked text for deletion and clicked Regenerate
  When AI generation completes
  Then the original text shall appear with red strikethrough decoration
  And the AI replacement text shall appear immediately after with green highlight
  And both shall be visible simultaneously in the editor
```

### AC-008: Diff Requires Explicit Interaction

```gherkin
Scenario: Diff does not auto-collapse
  Given a diff is displayed with original (red) and replacement (green) text
  When the user scrolls away and scrolls back
  Then the diff shall still be visible with both original and replacement text
  And neither segment shall have been auto-accepted or auto-rejected

Scenario: User restores original by clicking red text
  Given a diff is displayed with original (red) and replacement (green) text
  When the user clicks on the red strikethrough (original) text
  Then the original text shall be restored to its previous state
  And the AI replacement text shall be discarded
  And a provenance event of type "mark-applied" shall be logged with action "restore-original"

Scenario: User rejects AI by clicking green text
  Given a diff is displayed with original (red) and replacement (green) text
  When the user clicks on the green (AI replacement) text
  Then the AI replacement text shall be discarded
  And the original text shall be restored for that span
  And a provenance event of type "mark-applied" shall be logged with action "reject-ai"
```

### AC-009: Edit In-Place Within Diff

```gherkin
Scenario: User double-clicks text to enter edit mode
  Given text is displayed in the editor (any state)
  When the user double-clicks on a text segment
  Then a cursor shall appear at the clicked position
  And the segment shall become editable

Scenario: User exits edit mode by clicking outside
  Given the user is in edit mode on a text segment
  When the user clicks outside the segment
  Then edit mode shall deactivate
  And the text shall transition to state "user-edited"
  And a provenance event of type "edit-in-place" shall be logged with the original and new text

Scenario: User exits edit mode by pressing Escape
  Given the user is in edit mode on a text segment
  When the user presses the Escape key
  Then edit mode shall deactivate
  And the text shall transition to state "user-edited"
```

---

## 4. Provenance Logging and Export

### AC-010: All Interactions Are Logged

```gherkin
Scenario: Typing is logged as provenance event
  Given the editor is active
  When the user types "Hello world" into the editor
  Then the provenance log shall contain an event of type "text-typed"
  And the event shall include the typed content and cursor position
  And the event shall have a valid timestamp

Scenario: Goal change is logged as provenance event
  Given the editor is active with a goal set
  When the user manually edits the goal
  Then the provenance log shall contain an event of type "goal-changed"
  And the event data shall include previousGoal, newGoal, and source "manual"
```

### AC-011: Session Persistence via localStorage

```gherkin
Scenario: Session auto-saves to localStorage
  Given the user is actively writing in the editor
  When the user types text and pauses for 300ms (debounce threshold)
  Then the Session object shall be written to localStorage
  And the localStorage key shall follow the pattern "cowrithink-session-{sessionId}"

Scenario: Session restores on page reload
  Given a session was previously saved to localStorage
  When the user reloads the browser page
  Then the application shall detect the existing session
  And the editor shall restore the document state from the saved session
  And the goal shall be restored
  And the provenance log shall contain all previously logged events
```

### AC-012: Session Export Downloads JSON

```gherkin
Scenario: User exports the full session
  Given the user has been writing with multiple provenance events logged
  When the user clicks the "Export Session" button
  Then a JSON file shall be downloaded
  And the filename shall include the session ID and date
  And the JSON shall contain: id, goal, goalHistory, documentState, provenanceLog, relianceScores, createdAt, lastModifiedAt
  And every ProvenanceEvent in the export shall have: id, type, timestamp, and data fields
```

### AC-013: Storage Limit Warning

```gherkin
Scenario: Warning when localStorage nears capacity
  Given the session data has grown to approximately 4 MB (80% of estimated 5 MB limit)
  When the system performs a periodic storage check
  Then a non-blocking warning notification shall appear
  And the notification shall inform the user to export their session data
  And the notification shall not block the editor

Scenario: Error handling on storage write failure
  Given localStorage is completely full
  When the system attempts to persist the session
  Then the system shall queue the failed write for retry
  And after retries exhaust, an error notification shall appear
  And no provenance events shall be silently discarded
```

---

## 5. Layout Behavior

### AC-014: 70/30 Split Layout

```gherkin
Scenario: Default layout shows editor and side panel
  Given the user has entered the editor after setting a goal
  When the editor view is rendered
  Then the editor shall occupy approximately 70% of the viewport width
  And the side panel shall occupy approximately 30% of the viewport width
  And both shall be visible simultaneously
```

### AC-015: Side Panel Collapse and Expand

```gherkin
Scenario: User collapses the side panel
  Given the side panel is expanded (30% width)
  When the user clicks the side panel toggle button
  Then the side panel shall collapse to hidden
  And the editor shall expand to 100% width

Scenario: User expands the side panel
  Given the side panel is collapsed (editor at 100% width)
  When the user clicks the side panel toggle button
  Then the side panel shall expand to 30% width
  And the editor shall resize to 70% width
```

### AC-016: Side Panel Sections Present

```gherkin
Scenario: Side panel contains all required sections
  Given the side panel is expanded
  When the user views the side panel
  Then the Goal section shall be visible at the top with the current goal text and an edit control
  And the Pushback Comments section shall be present (empty when no active pushback)
  And the Round History section shall be present (empty until first regeneration)
  And the Document Outline section shall be present with auto-generated paragraph summaries

Scenario: Document Outline click-to-scroll
  Given the document has multiple paragraphs
  And the Document Outline shows paragraph summaries
  When the user clicks a paragraph entry in the Document Outline
  Then the editor shall scroll to that paragraph
```

---

## 6. Loading States

### AC-017: Skeleton Placeholder During AI Generation

```gherkin
Scenario: Loading state activates on AI generation request
  Given the user has triggered AI generation (via Regenerate or first draft)
  When the AI generation request is sent
  Then a pulsing gray skeleton placeholder shall appear in the editor at the insertion point
  And the Regenerate button shall display a spinner and become disabled
  And the prompt bar shall show a progress indicator
  And the editor shall become read-only (no typing or marking allowed)

Scenario: Side panel remains interactive during generation
  Given AI generation is in progress
  When the user interacts with the side panel
  Then the user shall be able to read and expand the goal
  And the user shall be able to scroll through Round History
  And the user shall be able to click Document Outline entries
```

### AC-018: Loading State Clears on Completion

```gherkin
Scenario: Successful generation clears loading state
  Given AI generation is in progress with skeleton placeholder displayed
  When the AI response is received successfully
  Then the skeleton placeholder shall be removed
  And the AI-generated text shall appear with diff view decorations
  And the editor shall become editable again
  And the Regenerate button shall be re-enabled without spinner

Scenario: Failed generation clears loading state with error
  Given AI generation is in progress
  When the API request fails (network error, timeout, or API error)
  Then the skeleton placeholder shall be removed
  And the editor shall become editable again
  And a non-blocking error message shall appear: "Generation failed. Please try again."
  And all text marks made prior to the failed generation shall remain intact
```

---

## 7. Edge Case Scenarios

### AC-019: Vague Goal Accepted

```gherkin
Scenario: System accepts vague goals without blocking
  Given the goal modal is displayed
  When the user enters "write something" as the goal
  And clicks submit
  Then the system shall accept the goal
  And the start mode selection shall appear
  And the goal "write something" shall be displayed in the header
```

### AC-020: Drastic Goal Change Mid-Session

```gherkin
Scenario: User changes goal dramatically during session
  Given the user has written 3 paragraphs with goal "argue for AI in education"
  When the user edits the goal to "argue against AI in education"
  Then the system shall accept the new goal immediately
  And the goalHistory shall record the change
  And existing text shall remain unchanged
  And future AI generation shall use the new goal as context
```

### AC-021: Multiple Unresolved Diffs Coexist

```gherkin
Scenario: Multiple diffs remain visible simultaneously
  Given the user has triggered AI generation for one section
  And the diff is still unresolved (not clicked)
  When the user selects a different section and triggers another generation
  Then both diffs shall be visible in the editor simultaneously
  And the user shall be able to interact with each diff independently
```

### AC-022: Network Failure During AI Generation

```gherkin
Scenario: API call fails gracefully
  Given the user clicks "Generate AI first draft"
  When the OpenAI API call fails due to network error
  Then the loading skeleton shall be removed
  And the error message "Generation failed. Please try again." shall appear
  And if text marks were present before generation, they shall remain in place
  And the user shall be able to continue writing or retry
```

### AC-023: Session with Zero AI Interaction

```gherkin
Scenario: User writes entire document manually
  Given the user selected "Start from scratch"
  When the user types an entire document without ever triggering AI generation
  Then all text shall have state "user-written"
  And no diffs shall be displayed
  And the provenance log shall contain only "text-typed" events
  And the Export Session button shall still produce a valid JSON file
```

---

## 8. Definition of Done

- [ ] All 25 requirements (REQ-CORE-001 through REQ-CORE-025) are implemented
- [ ] All acceptance criteria (AC-001 through AC-023) pass manual verification
- [ ] Seven text states render with correct visual decorations in the TipTap editor
- [ ] Goal prompt flow works end-to-end: modal -> validation -> mode selection -> editor
- [ ] Provenance store logs all specified event types with correct data payloads
- [ ] Session persists to localStorage and restores correctly on page reload
- [ ] Export Session produces valid JSON with complete session data
- [ ] Storage warning appears when localStorage usage exceeds 80%
- [ ] 70/30 layout renders correctly with collapsible side panel
- [ ] Loading states activate and clear correctly for both success and failure cases
- [ ] Editor is read-only during AI generation while side panel remains interactive
- [ ] No console errors or TypeScript type errors in development mode
- [ ] Component architecture matches the plan: stores, extensions, and components in their designated directories

---

## Traceability

| Acceptance Criteria | Requirements Covered                              |
|---------------------|--------------------------------------------------|
| AC-001              | REQ-CORE-002                                      |
| AC-002              | REQ-CORE-005                                      |
| AC-003              | REQ-CORE-003                                      |
| AC-004              | REQ-CORE-001                                      |
| AC-005              | REQ-CORE-004, REQ-CORE-006                        |
| AC-006              | REQ-CORE-007                                      |
| AC-007              | REQ-CORE-009                                      |
| AC-008              | REQ-CORE-010, REQ-CORE-011                        |
| AC-009              | REQ-CORE-012                                      |
| AC-010              | REQ-CORE-013                                      |
| AC-011              | REQ-CORE-014, REQ-CORE-015                        |
| AC-012              | REQ-CORE-016                                      |
| AC-013              | REQ-CORE-017, REQ-CORE-018                        |
| AC-014              | REQ-CORE-019                                      |
| AC-015              | REQ-CORE-020                                      |
| AC-016              | REQ-CORE-021                                      |
| AC-017              | REQ-CORE-022, REQ-CORE-023                        |
| AC-018              | REQ-CORE-024                                      |
| AC-019              | REQ-CORE-005, REQ-CORE-006                        |
| AC-020              | REQ-CORE-004, REQ-CORE-006                        |
| AC-021              | REQ-CORE-009, REQ-CORE-011                        |
| AC-022              | REQ-CORE-024                                      |
| AC-023              | REQ-CORE-007, REQ-CORE-013, REQ-CORE-016         |
