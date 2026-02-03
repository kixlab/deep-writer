# SPEC-GUARD-001: Acceptance Criteria

```yaml
spec_id: SPEC-GUARD-001
title: Guarded Compliance & Objective Surfacing
version: 1.0.0
status: draft
created: 2026-02-03
updated: 2026-02-03
```

---

## Acceptance Criteria Overview

This document defines acceptance criteria for SPEC-GUARD-001 using the Given/When/Then format. Each scenario maps to one or more requirements from the specification.

---

## 1. Pushback Scenarios

### AC-GUARD-001: Pushback Triggers on Goal Contradiction

**Requirement:** REQ-GUARD-001, REQ-GUARD-002

```gherkin
Given the user's writing goal is "Argue that AI in education has significant downsides"
  And the user has marked a paragraph for deletion and clicked Regenerate
  And the regeneration pipeline has returned new text that states
      "AI in education is overwhelmingly beneficial with no significant drawbacks"
When the Pushback Evaluator completes its evaluation
Then the contradicting segment shall be highlighted with an orange/warning decoration
  And a tooltip shall appear on hover containing:
    | Field            | Value                                                              |
    | Category         | goal-contradiction                                                 |
    | Explanation      | Text describing how the regenerated segment contradicts the goal   |
    | Suggested Edit   | A revised version that aligns with the goal                        |
  And the tooltip shall contain "Keep anyway" and "Accept suggestion" buttons
  And a corresponding entry shall appear in the side panel Pushback Comments section
```

---

### AC-GUARD-002: Pushback Triggers on Structural Coherence Issue

**Requirement:** REQ-GUARD-001, REQ-GUARD-002

```gherkin
Given the user has a three-paragraph argument where paragraph 2 establishes a premise
      used by paragraph 3
  And the user marked paragraph 2 for deletion and clicked Regenerate
  And the regeneration pipeline returned replacement text that omits the key premise
When the Pushback Evaluator completes its evaluation
Then the affected segment shall be highlighted with an orange/warning decoration
  And the tooltip explanation shall describe the structural break
      (e.g., "The premise supporting your conclusion in the next paragraph has been removed")
  And the tooltip shall contain "Keep anyway" and "Accept suggestion" buttons
  And a corresponding entry shall appear in the side panel Pushback Comments section
```

---

### AC-GUARD-003: Pushback Triggers on Quality Concern

**Requirement:** REQ-GUARD-001, REQ-GUARD-002

```gherkin
Given the user has preserved AI-generated text that reads
      "AI tools have had a remarkable impact on productivity"
  And the Pushback Evaluator identifies "remarkable impact" as vague and unsupported
When the Pushback Evaluator completes its evaluation
Then the vague segment shall be highlighted with an orange/warning decoration
  And the tooltip explanation shall state the quality concern
      (e.g., "'remarkable impact' is vague. Consider specifying what kind of impact")
  And the tooltip shall offer a suggested edit with more specific language
  And the tooltip shall contain "Keep anyway" and "Accept suggestion" buttons
```

---

### AC-GUARD-004: Pushback "Keep Anyway" Flow

**Requirement:** REQ-GUARD-003

```gherkin
Given a pushback warning is displayed on a segment with an orange highlight
  And the tooltip is visible with "Keep anyway" and "Accept suggestion" buttons
When the user clicks "Keep anyway"
Then the orange highlight shall be removed from the segment
  And the tooltip shall be dismissed
  And the segment text shall remain unchanged
  And a provenance event shall be logged:
    | Field           | Value                              |
    | type            | pushback-override                  |
    | segmentText     | The text of the flagged segment    |
    | triggerCategory | The category that triggered the flag |
    | timestamp       | Current timestamp                   |
  And the corresponding entry in the side panel Pushback Comments shall be removed
```

---

### AC-GUARD-005: Pushback "Accept Suggestion" Flow

**Requirement:** REQ-GUARD-004

```gherkin
Given a pushback warning is displayed on a segment reading "remarkable impact"
  And the suggested edit is "measurable 15% improvement in draft completion speed"
  And the tooltip shows the explanation and both action buttons
When the user clicks "Accept suggestion"
Then the segment text shall be replaced with "measurable 15% improvement in draft completion speed"
  And the orange highlight shall be removed
  And the tooltip shall be dismissed
  And a provenance event shall be logged:
    | Field           | Value                                                    |
    | type            | pushback-accepted                                        |
    | originalText    | remarkable impact                                        |
    | replacementText | measurable 15% improvement in draft completion speed     |
    | triggerCategory | quality-concern                                          |
    | timestamp       | Current timestamp                                        |
  And the segment's text state shall be updated to reflect the applied edit
  And the corresponding entry in the side panel Pushback Comments shall be removed
```

---

### AC-GUARD-006: Multiple Simultaneous Pushback Flags

**Requirement:** REQ-GUARD-001, REQ-GUARD-002

```gherkin
Given the user clicked Regenerate and the regeneration pipeline returned three new segments
  And the Pushback Evaluator flags:
    - Segment A: goal-contradiction
    - Segment B: quality-concern
    - Segment C: structural-coherence
When the pushback evaluation completes
Then all three segments shall display orange/warning highlights simultaneously
  And each segment shall have its own independent tooltip with its specific explanation
  And the side panel Pushback Comments section shall list all three flags
  And the section header shall read "Pushback Comments (3)"
  And resolving one flag shall not affect the other flags
  And after resolving Segment A, the header shall update to "Pushback Comments (2)"
```

---

### AC-GUARD-007: Pushback Respects User Autonomy (No Escalation)

**Requirement:** REQ-GUARD-006

```gherkin
Given the user has overridden pushback warnings ("Keep anyway") five consecutive times
  And the system has logged five pushback-override events in provenance
When the next regeneration completes and the Pushback Evaluator runs
Then the evaluation shall use the same confidence threshold as before
  And the system shall not increase the frequency or severity of warnings
  And the system shall not display any additional messaging about repeated overrides
  And the system shall not change its evaluation behavior based on override history
```

---

### AC-GUARD-008: Pushback on User-Written Text (Higher Threshold)

**Requirement:** REQ-GUARD-005

```gherkin
Given the user has typed their own paragraph containing a mildly informal tone
  And the user clicks Regenerate for a different section of the document
  And the Pushback Evaluator processes all visible segments including the user-written one
When the evaluation completes
Then the user-written paragraph shall NOT be flagged for stylistic informality
  And user-written segments shall only be flagged for clear structural or factual issues
  And the evaluation prompt shall explicitly convey the higher threshold for user-authored text
```

---

### AC-GUARD-009: Pushback False Positive (User Intentional Counterargument)

**Requirement:** REQ-GUARD-003, REQ-GUARD-006

```gherkin
Given the user's goal is "Argue for AI in education"
  And the user intentionally wrote a counterargument paragraph as a rhetorical device
  And the Pushback Evaluator flags the counterargument as "goal-contradiction"
When the user sees the pushback warning and clicks "Keep anyway"
Then the warning shall be dismissed and the counterargument shall remain
  And a pushback-override event shall be logged in provenance
  And the system shall not re-flag this specific text in subsequent evaluations
      of the same regeneration cycle
  And the system may flag similar patterns in future regeneration cycles
      (v1 does not learn from overrides)
```

---

## 2. Process 2 (Objective Surfacing) Scenarios

### AC-GUARD-010: Process 2 Detects Misalignment After User Pause

**Requirement:** REQ-GUARD-007, REQ-GUARD-008

```gherkin
Given the user's goal is "An argumentative essay about AI in education, yes but with concerns"
  And the user has completed three regeneration cycles
  And all three cycles focused exclusively on AI benefits with no mention of concerns
  And the most recent regeneration cycle has completed
  And the user has stopped interacting with the editor for 5 seconds (idle threshold)
When the Objective Monitor evaluation completes
Then a notification bar shall appear at the bottom of the editor
  And the notification bar shall NOT block or overlay the editor content
  And the notification shall describe the misalignment
      (e.g., "Your essay argues entirely in favor of AI, but your goal mentions 'with some concerns'")
  And the notification shall display 2-3 direction options as selectable radio buttons
  And the notification shall contain "Apply selected" and "Dismiss" buttons
```

---

### AC-GUARD-011: Process 2 Option Selection Updates Goal

**Requirement:** REQ-GUARD-009

```gherkin
Given a Process 2 notification is displayed with three options:
    - Option 1: "Add a paragraph addressing concerns about AI"
    - Option 2: "Reframe: AI is beneficial BUT needs safeguards"
    - Option 3: "Update goal: remove the concerns angle"
  And the user selects Option 2 (radio button)
When the user clicks "Apply selected"
Then the writing goal shall update to the proposedGoalUpdate from Option 2
  And the goal display in the editor header shall reflect the new goal
  And the goal in the side panel Goal section shall reflect the new goal
  And the notification bar shall be dismissed
  And a provenance event shall be logged:
    | Field         | Value                                                    |
    | type          | goal-updated-via-process2                                |
    | oldGoal       | An argumentative essay about AI in education, yes but... |
    | newGoal       | The proposedGoalUpdate string from Option 2              |
    | selectedOption| Option 2 label                                           |
    | timestamp     | Current timestamp                                        |
  And the next pushback evaluation shall use the updated goal
  And the next Process 2 evaluation shall use the updated goal
```

---

### AC-GUARD-012: Process 2 Dismiss Prevents Re-Trigger

**Requirement:** REQ-GUARD-011

```gherkin
Given a Process 2 notification is displayed describing misalignment X
  And the user clicks "Dismiss"
When the notification bar disappears
Then a dismissed observation shall be stored in session state containing:
    | Field            | Value                                 |
    | description      | The misalignment description          |
    | dismissedAt      | Current timestamp                     |
  And a provenance event of type process2-dismissed shall be logged
  And on subsequent regeneration cycles with the same or similar misalignment:
    The Objective Monitor shall detect the similarity to the dismissed observation
    And shall NOT display a new notification for this misalignment
  And on a subsequent regeneration cycle with a NEW, distinct misalignment:
    The Objective Monitor shall display a notification for the new misalignment
```

---

### AC-GUARD-013: Process 2 Never Interrupts Active Editing

**Requirement:** REQ-GUARD-010

```gherkin
Given a regeneration cycle has just completed
  And the Objective Monitor has detected a misalignment
  And the idle timer has NOT yet elapsed (user is actively marking text)
When the user continues to mark, edit, or type in the editor
Then the Process 2 notification shall NOT appear
  And the idle timer shall reset on each user activity
  And the notification shall only appear once the user pauses for the full idle threshold duration

Given a regeneration cycle has just completed
  And the idle timer has elapsed
  And the Process 2 notification is about to render
  And the user clicks in the editor at that exact moment (resumes activity)
When the system detects the user activity
Then the notification shall be suppressed
  And the notification shall wait for the next idle window after a regeneration cycle
```

---

### AC-GUARD-014: Process 2 Handles Vague Goal with Refinement Suggestion

**Requirement:** REQ-GUARD-012

```gherkin
Given the user's goal is "Write something about technology"
  And the user has completed a regeneration cycle
  And the user has paused (idle threshold met)
When the Objective Monitor evaluates the document against the vague goal
Then the notification bar shall appear
  And at least one of the 2-3 direction options shall suggest goal refinement
      (e.g., "Narrow your goal: focus on how technology affects education")
  And the other options shall propose concrete directions derived from the document content
  And the notification bar shall function identically to standard misalignment notifications
      (user can select + apply, or dismiss)
```

---

### AC-GUARD-015: Process 2 Does Not Trigger Without Prior Regeneration

**Requirement:** REQ-GUARD-007

```gherkin
Given the user is writing from scratch and has not triggered any AI regeneration
  And the user pauses typing for longer than the idle threshold
When the idle timer elapses
Then Process 2 evaluation shall NOT be triggered
  And no notification bar shall appear
  And the system shall wait until a regeneration cycle completes before enabling Process 2
```

---

## 3. Integration Scenarios

### AC-GUARD-016: Pushback and Process 2 Coexist After Regeneration

**Requirement:** REQ-GUARD-001, REQ-GUARD-007

```gherkin
Given the user has clicked Regenerate
  And the regeneration pipeline has returned results
When the Pushback Evaluator flags two segments with warnings
  And the user resolves one pushback warning and then pauses (idle threshold met)
  And the Objective Monitor detects a misalignment
Then both the remaining pushback warning (orange highlight + tooltip) and
    the Process 2 notification bar shall be visible simultaneously
  And the pushback warning shall appear inline in the editor
  And the Process 2 notification bar shall appear at the bottom
  And resolving the pushback warning shall not affect the Process 2 notification
  And dismissing the Process 2 notification shall not affect the pushback warning
```

---

### AC-GUARD-017: GPT-4o API Failure Graceful Degradation

**Requirement:** (Technical Constraint TC-10)

```gherkin
Given the user has clicked Regenerate
  And the regeneration pipeline has returned results
When the Pushback Evaluator's GPT-4o API call fails (timeout, network error, or API error)
Then no pushback warnings shall be displayed
  And the diff view shall appear normally without delay
  And a console error shall be logged with the failure details
  And the user shall not see any error message related to pushback

Given a regeneration cycle has completed and the user is idle
When the Objective Monitor's GPT-4o API call fails
Then no Process 2 notification shall be displayed
  And a console error shall be logged with the failure details
  And the user shall not see any error message related to Process 2
```

---

### AC-GUARD-018: Side Panel Pushback Comments Lifecycle

**Requirement:** REQ-GUARD-002, REQ-GUARD-003, REQ-GUARD-004

```gherkin
Given no pushback warnings are active
Then the Pushback Comments section in the side panel shall show "No active warnings"

Given the Pushback Evaluator flags three segments after a regeneration
When the warnings are displayed
Then the Pushback Comments section shall list all three entries with:
    - Flagged text excerpt
    - Trigger category badge (goal-contradiction / structural-coherence / quality-concern)
    - Explanation summary
    - "Keep anyway" and "Accept suggestion" buttons
  And the section header shall read "Pushback Comments (3)"

When the user clicks "Keep anyway" on the first entry in the side panel
Then that entry shall be removed from the side panel list
  And the corresponding inline orange highlight shall be removed from the editor
  And the section header shall update to "Pushback Comments (2)"

When the user clicks "Accept suggestion" on an entry in the side panel
Then that entry shall be removed from the side panel list
  And the corresponding segment in the editor shall be updated with the suggested edit
  And the orange highlight shall be removed
```

---

## 4. Definition of Done

### Functional Completeness

- [ ] Pushback evaluation runs after every regeneration cycle
- [ ] All three trigger categories (goal contradiction, structural coherence, quality concern) are evaluated
- [ ] Flagged segments display orange highlights with tooltips
- [ ] "Keep anyway" dismisses warning and logs override
- [ ] "Accept suggestion" applies edit and logs acceptance
- [ ] Multiple simultaneous flags render correctly
- [ ] Side panel Pushback Comments mirrors inline warnings
- [ ] Process 2 triggers only after regeneration + idle threshold
- [ ] Process 2 notification bar appears at bottom, non-blocking
- [ ] 2-3 direction options are generated and selectable
- [ ] "Apply selected" updates goal and dismisses notification
- [ ] "Dismiss" stores observation and prevents re-trigger
- [ ] Process 2 never interrupts active editing
- [ ] Vague goal triggers refinement suggestion in options
- [ ] All events logged in provenance store

### Quality Gates

- [ ] No TypeScript type errors (strict mode)
- [ ] No ESLint errors
- [ ] All pushback and Process 2 events appear in session export JSON
- [ ] Orange highlight is visually distinct from green, red, and default text states
- [ ] Notification bar does not shift editor scroll position
- [ ] Tooltips and notification bar are keyboard-accessible (tab focus)
- [ ] Graceful degradation on GPT-4o API failure (no user-facing error)

### Edge Cases Verified

- [ ] Pushback on user-written text uses higher threshold
- [ ] User overrides do not escalate system behavior
- [ ] Dismissed Process 2 observation is not re-triggered
- [ ] New distinct misalignment triggers after dismissed observation
- [ ] Process 2 does not trigger without prior regeneration
- [ ] Rapid regeneration cycles do not produce duplicate Process 2 notifications
- [ ] Both pushback and Process 2 can be visible simultaneously
