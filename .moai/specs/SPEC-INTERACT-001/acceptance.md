# SPEC-INTERACT-001: Acceptance Criteria

```yaml
spec_id: SPEC-INTERACT-001
title: Marking Interaction and AI Generation - Acceptance Criteria
version: 1.0.0
created: 2026-02-03
updated: 2026-02-03
author: Dr.WriThink
```

---

## 1. Progressive Click Expansion (REQ-1)

### Scenario 1.1: Word-level selection on first click

```gherkin
Given the editor contains the text "The rapid growth of AI writing tools has fundamentally changed how people approach the writing process."
  And no text is currently selected
When the user clicks on the word "fundamentally"
Then the system selects only the word "fundamentally" (whitespace boundaries)
  And the selected region is highlighted with a word-level visual indicator
  And the selection level is "word"
```

### Scenario 1.2: Phrase-level expansion on second click

```gherkin
Given the editor contains the text "The rapid growth of AI writing tools has fundamentally changed how people approach the writing process."
  And the word "fundamentally" is currently selected at word level
When the user clicks on the same region again
Then the system expands the selection to the phrase "fundamentally changed how" (bounded by conjunction "how" or nearest punctuation/conjunction boundary)
  And the selected region visually grows to encompass the phrase
  And a distinct border indicates phrase-level scope
  And the selection level is "phrase"
```

### Scenario 1.3: Sentence-level expansion on third click

```gherkin
Given the editor contains a multi-sentence paragraph
  And the phrase "fundamentally changed how" is currently selected at phrase level
When the user clicks on the same region a third time
Then the system expands the selection to the full sentence ending at the period
  And the selected region visually grows to encompass the sentence
  And a distinct border indicates sentence-level scope
  And the selection level is "sentence"
```

### Scenario 1.4: Reset on click outside

```gherkin
Given a word, phrase, or sentence is currently selected
When the user clicks on a region outside the current selection
Then the current selection is cleared
  And the click counter resets to zero
  And the next click on any text starts from word level
```

### Scenario 1.5: New selection on different region

```gherkin
Given the word "fundamentally" is selected at word level
When the user clicks on the word "approach" (a different region)
Then the selection on "fundamentally" is cleared
  And "approach" is selected at word level
  And the click counter resets to 1 for the new region
```

---

## 2. Toggle Marking Behavior (REQ-2)

### Scenario 2.1: Mark unmarked text as deleted

```gherkin
Given the editor contains text with the word "fundamentally" selected at word level
  And the segment "fundamentally" is currently unmarked
When the user clicks on the selected text
Then the segment "fundamentally" is marked as deleted
  And the segment displays with a red strikethrough visual
  And a provenance event is logged with type "mark-applied", action "delete", and the segment text
```

### Scenario 2.2: Toggle deleted text back to unmarked

```gherkin
Given the segment "fundamentally" is marked as deleted (red strikethrough)
When the user clicks on the deleted segment
Then the segment "fundamentally" returns to unmarked state
  And the red strikethrough is removed
  And a provenance event is logged with type "mark-applied", action "unmark"
```

### Scenario 2.3: Toggle preserved text to deleted

```gherkin
Given the segment "fundamentally" is marked as preserved (after diff resolution)
When the user clicks on the preserved segment
Then the segment is toggled to deleted state (red strikethrough)
  And a provenance event is logged with type "mark-applied", action "delete"
```

### Scenario 2.4: Enter edit mode via double-click

```gherkin
Given the editor contains the text "fundamentally changed how"
When the user double-clicks on the word "fundamentally"
Then a text cursor appears at the double-click position within the segment
  And the segment shows an editable visual indicator (e.g., blue border)
  And the user can type to modify the text directly
```

### Scenario 2.5: Exit edit mode and commit changes

```gherkin
Given the user is in edit mode on the segment "fundamentally"
  And the user has changed the text to "significantly"
When the user presses Escape
Then edit mode exits
  And the segment text is now "significantly"
  And the segment state is set to "user-edited"
  And a provenance event is logged with type "edit-in-place", original "fundamentally", new "significantly"
```

### Scenario 2.6: Exit edit mode by clicking outside

```gherkin
Given the user is in edit mode on a segment
  And the user has made edits
When the user clicks outside the segment
Then edit mode exits
  And changes are committed
  And the segment state is set to "user-edited"
```

---

## 3. Regeneration with Mixed Marks (REQ-3, REQ-4)

### Scenario 3.1: Regenerate with some preserved and some deleted segments

```gherkin
Given the editor contains a paragraph with 3 sentences
  And sentence 1 is marked as preserved
  And sentence 2 is marked as deleted
  And sentence 3 is unmarked (user-written)
When the user clicks the "Regenerate" button
Then the system sends sentence 2 as a gap to fill
  And sentences 1 and 3 are sent as constraints
  And the user's writing goal is included in the prompt
  And an API call is made to /api/generate
  And while generating, a skeleton placeholder appears where sentence 2 was
  And the editor is set to read-only
  And the Regenerate button shows a spinner
```

### Scenario 3.2: Diff display after successful regeneration

```gherkin
Given a regeneration request has been submitted for sentence 2
When the AI returns replacement text for the gap
Then the original sentence 2 is displayed with red strikethrough
  And the AI replacement text is displayed with green highlight below/adjacent to the original
  And the editor returns to editable mode
  And the Regenerate button is re-enabled
  And the skeleton placeholder is removed
  And a provenance event is logged with type "ai-generation", including the prompt, gap positions, and generated text
```

### Scenario 3.3: Resolve diff by restoring original

```gherkin
Given an inline diff is displayed showing original (red) and AI replacement (green)
When the user clicks on the red (original-removed) text
Then the original text is restored
  And the AI replacement is discarded
  And the diff display for that segment is cleared
  And a provenance event is logged with type "diff-resolved", action "restore-original"
```

### Scenario 3.4: Resolve diff by rejecting AI replacement

```gherkin
Given an inline diff is displayed showing original (red) and AI replacement (green)
When the user clicks on the green (AI replacement) text
Then the AI replacement is rejected
  And the original text is restored
  And the diff display for that segment is cleared
  And a provenance event is logged with type "diff-resolved", action "reject-ai"
```

### Scenario 3.5: Multiple coexisting diffs

```gherkin
Given the editor has two separate regions marked for deletion
  And a regeneration has produced diffs for both regions
When the user resolves diff 1 by restoring original
Then diff 1 is resolved and cleared
  And diff 2 remains visible and unresolved
  And the user can independently resolve diff 2
```

---

## 4. Prompt Bar Dual-Mode Behavior (REQ-6)

### Scenario 4.1: Prompt bar with active text selection

```gherkin
Given the editor contains a paragraph of text
  And the user has selected the sentence "AI tools help students brainstorm."
When the user types "Make this more specific to college students" in the prompt bar
  And the user presses Enter
Then the system sends the request to the AI with the selected sentence as the target region
  And the AI generates replacement text for the selected sentence
  And the result appears as an inline diff (original strikethrough + green replacement)
  And a provenance event is logged with type "prompt-request", the request text, and the selection range
  And the prompt bar input is cleared
```

### Scenario 4.2: Prompt bar without selection (cursor only)

```gherkin
Given the editor contains text with the cursor positioned at the end of a paragraph
  And no text is selected
When the user types "Add a counterargument about privacy concerns" in the prompt bar
  And the user clicks the send button
Then the system sends the request to the AI with the cursor position and surrounding context
  And the AI generates continuation text at the cursor position
  And the generated text appears with an inline diff (green highlight for new AI text)
  And a provenance event is logged with type "prompt-request", the request text, and the cursor position
  And the prompt bar input is cleared
```

### Scenario 4.3: Loading state during prompt bar generation

```gherkin
Given the user has submitted a request via the prompt bar
When the AI is generating a response
Then the prompt bar displays a loading indicator
  And the input field is disabled during generation
  And the send button is disabled
When the generation completes
Then the loading indicator disappears
  And the input field becomes active again
```

### Scenario 4.4: No chat history shown

```gherkin
Given the user has previously submitted 3 requests via the prompt bar
When the user looks at the prompt bar area
Then no previous requests are displayed
  And only the empty input field with placeholder text is shown
  And the prompt bar does not function as a chat interface
```

---

## 5. API Error Handling (REQ-7)

### Scenario 5.1: Network error during regeneration

```gherkin
Given the user has marked segments for deletion
  And the user clicks "Regenerate"
When the API call to /api/generate fails due to a network error
Then a non-blocking error message is displayed: "Generation failed. Please try again."
  And all existing marks remain in place unchanged
  And the editor returns to editable mode
  And the Regenerate button is re-enabled (since marks still exist)
  And the skeleton placeholders are removed
```

### Scenario 5.2: API rate limiting

```gherkin
Given the user triggers a regeneration request
When the OpenAI API returns a 429 (rate limit) error
Then a non-blocking error message is displayed: "Rate limited. Please wait and retry."
  And all marks and text state are preserved
  And the user can retry after a brief wait
```

### Scenario 5.3: API timeout

```gherkin
Given the user triggers a regeneration or prompt bar request
When the API call exceeds the 30-second timeout
Then a non-blocking error message is displayed: "Request timed out. Please try again."
  And all marks and text state are preserved
  And the loading state is cleared
  And the user can retry immediately
```

### Scenario 5.4: Malformed API response

```gherkin
Given the user triggers a regeneration request
When the OpenAI API returns a response that is not valid JSON
Then the system attempts fallback parsing to extract gap fills
  If fallback parsing succeeds:
    Then the gap fills are applied normally
  If fallback parsing fails:
    Then a non-blocking error message is displayed: "Could not parse AI response. Please try again."
    And all marks and text state are preserved
```

---

## 6. Mixed Selection Spanning Authorship Types (REQ-5)

### Scenario 6.1: Selection spanning user-written and AI-generated text

```gherkin
Given the editor contains a paragraph where:
  - "The rapid growth" is user-written
  - "of AI writing tools" is AI-generated
When the user selects text spanning both segments ("rapid growth of AI writing")
Then the system treats the entire selection as one unit
  And toggling marks the entire selection uniformly (all to deleted, or all to unmarked)
  And the selection does not split at authorship boundaries
```

### Scenario 6.2: Selection spanning marked and unmarked segments

```gherkin
Given the editor contains text where:
  - "fundamentally changed" is marked as deleted
  - "how people" is unmarked
When the user selects text spanning both segments
Then the system treats the entire selection as one unit
  And the toggle action applies to the whole selection (e.g., all become deleted)
```

---

## 7. Edge Cases

### Scenario 7.1: Regenerate button disabled when no marks exist

```gherkin
Given the editor contains text
  And no segments are marked for deletion
When the user looks at the Regenerate button
Then the button is visible but disabled (gray, non-clickable)
  And clicking the button has no effect
  And no API call is made
```

### Scenario 7.2: User marks everything for deletion

```gherkin
Given the editor contains a full paragraph of text
  And the user marks every segment in the document for deletion
When the user clicks "Regenerate"
Then the system sends the entire document as gaps with only the writing goal as context
  And the AI generates entirely new text from scratch based on the goal
  And the result appears as an inline diff
  And this is equivalent to generating an AI first draft
```

### Scenario 7.3: Double-click inside an active diff

```gherkin
Given an inline diff is displayed showing original (red) and AI replacement (green)
When the user double-clicks on text within the green (AI replacement) segment
Then edit mode activates on that segment
  And the user can modify the AI-generated text directly
  And on exit, the segment state becomes "user-edited"
  And the diff for that segment is resolved (user's edited version is accepted)
```

### Scenario 7.4: Click outside editor deselects all

```gherkin
Given the user has an active word-level selection with marks
When the user clicks on the side panel or outside the editor area
Then the active selection is cleared
  And the click counter resets to zero
  And existing marks (deleted, preserved) remain in place
```

### Scenario 7.5: Rapid clicking does not exceed sentence level

```gherkin
Given the user clicks on the same region 4 or more times rapidly
When the fourth and subsequent clicks occur
Then the selection remains at sentence level (does not expand further)
  And each additional click toggles the mark at sentence level
```

### Scenario 7.6: Prompt bar does not capture editor keystrokes

```gherkin
Given the user is typing in the editor (not in the prompt bar)
When the user presses Enter
Then the editor inserts a newline (standard editor behavior)
  And the prompt bar does not intercept the Enter key
  And no AI request is submitted
```

### Scenario 7.7: Regeneration during active edit mode

```gherkin
Given the user is in edit mode on a text segment
When the user clicks the Regenerate button
Then the system exits edit mode first, committing any changes
  And then proceeds with the regeneration flow
  And the edited text is treated as user-written in the regeneration context
```

### Scenario 7.8: Empty prompt bar submission

```gherkin
Given the prompt bar input is empty (no text typed)
When the user presses Enter or clicks the send button
Then no API request is made
  And no error message is shown
  And the prompt bar remains in its current state
```

---

## 8. Quality Gate Criteria

### Functional Completeness

- [ ] All 8 requirements (REQ-1 through REQ-8) are implemented and testable
- [ ] Progressive granularity works for word, phrase, and sentence levels
- [ ] Toggle behavior works for all state transitions (unmarked, deleted, preserved)
- [ ] Edit mode entry (double-click) and exit (Escape, click outside) function correctly
- [ ] Regeneration flow completes end-to-end: mark -> regenerate -> diff -> resolve
- [ ] Prompt bar works in both modes (with selection and without selection)
- [ ] API errors are handled gracefully without data loss

### Provenance Logging

- [ ] Every mark application generates a provenance event
- [ ] Every edit mode change generates a provenance event
- [ ] Every regeneration request and response generates provenance events
- [ ] Every prompt bar submission generates a provenance event
- [ ] Every diff resolution generates a provenance event
- [ ] Events include timestamp, segment details, and action type

### Performance

- [ ] Click-to-highlight latency is under 50ms for progressive granularity
- [ ] Regeneration API call completes within 30 seconds for typical requests
- [ ] Loading states (skeleton, spinner) appear within 100ms of triggering generation
- [ ] Editor remains responsive (no frame drops) with up to 10 active marks

### Error Resilience

- [ ] Network failure during regeneration preserves all marks and text
- [ ] API timeout does not leave the editor in a broken state
- [ ] Malformed API response triggers fallback parsing or clear error message
- [ ] No data loss occurs under any error condition

---

## Definition of Done

1. All acceptance scenarios in sections 1-7 pass manual testing
2. All quality gate criteria in section 8 are checked off
3. Provenance store captures the complete interaction history for all marking and generation events
4. The Regenerate button correctly reflects the current mark state (enabled/disabled)
5. The prompt bar correctly detects selection vs cursor mode
6. The OpenAI API key is never exposed to the client
7. Error states are non-blocking and preserve user work
8. The feature integrates with SPEC-CORE-001 components (editor, text states, provenance store, layout, goal)
