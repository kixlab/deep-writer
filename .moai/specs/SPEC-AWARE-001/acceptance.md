# SPEC-AWARE-001: Acceptance Criteria

**SPEC Reference:** SPEC-AWARE-001 - Reliance Assessment & Awareness Layer
**Tags:** SPEC-AWARE-001, awareness, reliance-assessment, overlay, export
**Format:** Given-When-Then (Gherkin)

---

## AC-001: Always-On Indicator Default State

**Requirement:** REQ-AWARE-001, REQ-AWARE-002

```gherkin
Scenario: Indicator displays "--" before any AI interaction
  Given the user has started a new writing session
  And the user has entered a writing goal
  And no AI generation has been triggered yet
  When the editor is displayed
  Then the reliance indicator shall be visible in the top-right corner
  And the indicator shall display "--" instead of a percentage
  And the indicator bar shall show no color fill
```

```gherkin
Scenario: Indicator remains "--" while user writes without AI
  Given the user is in an active session with no AI interaction
  When the user types text from scratch in the editor
  Then the indicator shall continue to display "--"
  And no assessment shall be triggered
```

---

## AC-002: Indicator Updates After Regeneration Cycle

**Requirement:** REQ-AWARE-003

```gherkin
Scenario: Indicator updates to percentage after first regeneration
  Given the user has started a session and the indicator shows "--"
  And the user has marked at least one segment for deletion
  When the user clicks "Regenerate" and the cycle completes
  And the LLM assessment returns a level for the round
  Then the indicator shall update from "--" to a numeric percentage
  And the percentage shall equal (session_score / 5) * 100
  And the update shall occur within 500ms of receiving the assessment result
```

```gherkin
Scenario: Indicator recalculates with recency-weighted average
  Given the user has completed 3 rounds with levels [2, 3, 4]
  When the session score is calculated
  Then the score shall use recency-weighted averaging
  And round 3 (level 4) shall carry more weight than round 1 (level 2)
  And the displayed percentage shall reflect the weighted calculation
```

```gherkin
Scenario: Indicator shows loading state during assessment
  Given the user has completed a regeneration cycle
  When the LLM assessment API call is in progress
  Then the indicator shall show a brief loading animation
  And the previous score (or "--") shall remain visible until the new score arrives
```

---

## AC-003: Color Overlay Toggle

**Requirement:** REQ-AWARE-004, REQ-AWARE-005

```gherkin
Scenario: User activates color overlay by clicking indicator
  Given the user has completed at least 1 round with an assessment result
  And the color overlay is currently inactive
  When the user clicks the reliance indicator
  Then the color overlay shall activate on the editor text
  And each AI-interacted text segment shall display a background color
  And the background color shall correspond to the reliance level of the most recent round that produced or modified that segment
  And the indicator shall visually indicate the overlay is active
```

```gherkin
Scenario: User deactivates color overlay by clicking indicator again
  Given the color overlay is currently active
  When the user clicks the reliance indicator
  Then the color overlay shall deactivate
  And all awareness background colors shall be removed from the editor text
  And the indicator shall visually indicate the overlay is inactive
```

```gherkin
Scenario: Overlay colors map correctly to reliance levels
  Given the color overlay is active
  And the session contains segments assessed at different levels
  When the overlay renders
  Then Level 5 segments shall display a deep warm (dark orange) background
  And Level 4 segments shall display a warm (orange) background
  And Level 3 segments shall display a neutral (yellow) background
  And Level 2 segments shall display a cool (light blue) background
  And Level 1 segments shall display a deep cool (gray) background
  And user-written text that was never touched by AI shall have no overlay color
```

```gherkin
Scenario: Overlay uses cached assessment data when available
  Given the user has completed rounds with assessment results already cached
  When the user toggles the overlay on
  Then the overlay shall render using cached data without making new LLM API calls
  And the overlay shall appear within 200ms of the toggle action
```

---

## AC-004: Per-Round LLM Assessment

**Requirement:** REQ-AWARE-006, REQ-AWARE-007

```gherkin
Scenario: Assessment returns level 1-5 with justification after regeneration
  Given the user has completed a marking-regeneration cycle
  And the round events have been collected from the provenance store
  When the LLM assessment service is invoked
  Then the response shall contain a "level" field with an integer between 1 and 5
  And the response shall contain "dimension_scores" with scores for all 4 dimensions
  And the response shall contain a "justification" field with 2-3 explanatory sentences
  And the response shall be valid JSON matching the expected schema
```

```gherkin
Scenario: Assessment evaluates all four dimensions
  Given a round where the user:
    - Made selective marks (preserve 2 sentences, delete 1)
    - Sent request "Make the second paragraph more concise"
    - Changed "utilize" to "use" and rephrased one clause
    - Spent 45 seconds reviewing before first mark
  When the LLM assessment runs
  Then the marking_behavior dimension shall receive a score between 1-5
  And the request_quality dimension shall receive a score between 1-5
  And the editing_depth dimension shall receive a score between 1-5
  And the temporal_patterns dimension shall receive a score between 1-5
  And the justification shall reference observable evidence from the round events
```

```gherkin
Scenario: Synthesis rule - Level 5 dimension guarantees at least Level 4 round
  Given a round where the user substantially rewrote AI text from scratch
  And the marking_behavior dimension scores Level 5
  When the LLM assessment synthesizes the round level
  Then the overall round level shall be at least Level 4
  And the justification shall acknowledge the substantial user authorship
```

```gherkin
Scenario: Synthesis rule - All dimensions Level 1 produces Level 1 round
  Given a round where the user:
    - Made no marks at all
    - Sent no request or only "continue"
    - Made no edits to AI text
    - Had near-zero dwell time on generated text
  When the LLM assessment synthesizes the round level
  Then the overall round level shall be Level 1
  And all four dimension scores shall be Level 1
```

```gherkin
Scenario: Assessment handles mixed dimensions without simple averaging
  Given a round where the user:
    - Made deliberate marks (Level 4 marking behavior)
    - Sent a vague request "make it better" (Level 2 request quality)
    - Made meaningful edits (Level 4 editing depth)
    - Spent moderate time (Level 3 temporal patterns)
  When the LLM assessment synthesizes the round level
  Then the overall round level shall NOT be the arithmetic mean (3.25 -> 3)
  And the LLM shall weigh the most informative signals
  And the justification shall explain which dimensions were most informative
```

```gherkin
Scenario: Assessment handles malformed LLM response gracefully
  Given a regeneration cycle has completed
  When the LLM assessment service receives a response that fails schema validation
  Then the service shall retry the assessment call once
  And if the retry also fails validation
  Then the service shall assign a default Level 3 (neutral)
  And the failure shall be logged for study analysis
```

---

## AC-005: Round History Panel

**Requirement:** REQ-AWARE-008, REQ-AWARE-009

```gherkin
Scenario: Round history displays all completed rounds
  Given the user has completed 4 rounds with levels [2, 4, 3, 5]
  When the side panel is visible
  Then the Round History section shall display 4 entries
  And Round 4 (most recent) shall appear at the top
  And Round 1 (earliest) shall appear at the bottom
  And each entry shall show the round number
  And each entry shall show filled dots corresponding to the level (e.g., 4 filled + 1 empty for Level 4)
  And each entry shall show the level name
```

```gherkin
Scenario: Round history updates in real-time after new round
  Given the user is viewing the Round History panel showing 3 rounds
  When the user completes a 4th regeneration cycle
  And the LLM assessment returns Level 3 for the round
  Then a new entry "Round 4" shall appear at the top of the history list
  And the entry shall show 3 filled dots and 2 empty dots
  And the entry shall show "Selectively Engaged"
```

```gherkin
Scenario: User drills down into round detail
  Given the Round History panel shows Round 2 with Level 4
  When the user clicks on the Round 2 entry
  Then an expanded detail section shall appear below Round 2
  And the detail shall show: segments marked in that round
  And the detail shall show: the request text sent to AI
  And the detail shall show: a preview of AI-generated text
  And the detail shall show: dimension scores for all 4 dimensions
  And the detail shall show: the LLM justification text
```

```gherkin
Scenario: User collapses round detail
  Given Round 2 detail is currently expanded
  When the user clicks on the Round 2 entry again
  Then the detail section shall collapse
  And only the summary (round number, dots, level name) shall remain visible
```

---

## AC-006: Session Export

**Requirement:** REQ-AWARE-010

```gherkin
Scenario: Session export produces valid JSON with all required fields
  Given the user has completed a session with 3 rounds
  And the session has a writing goal, provenance log, and assessment results
  When the user clicks the "Export Session" button
  Then a JSON file shall be downloaded to the user's device
  And the file name shall follow the pattern "cowrithink-session-{id}-{date}.json"
  And the JSON shall contain "sessionId" as a string
  And the JSON shall contain "exportedAt" as an ISO 8601 timestamp
  And the JSON shall contain "goal" as the current writing goal text
  And the JSON shall contain "goalHistory" as an array of goal changes
  And the JSON shall contain "documentState" with plainText, html, and wordCount
  And the JSON shall contain "provenanceLog" as the complete event array
  And the JSON shall contain "rounds" with assessment results for each round
  And the JSON shall contain "relianceScores" with per-segment level data
  And the JSON shall contain "sessionMetadata" with duration, totalRounds, and finalSessionScore
```

```gherkin
Scenario: Export includes reliance scores with justifications
  Given a session with 2 rounds assessed at Level 3 and Level 4
  When the session is exported
  Then the "rounds" array shall contain 2 objects
  And each round object shall include "level", "dimensionScores", and "justification"
  And the "justification" field shall contain 2-3 sentences of assessment explanation
  And the "dimensionScores" shall include all 4 dimension scores
```

```gherkin
Scenario: Export works for session with no AI interaction
  Given the user typed text from scratch and never triggered AI generation
  When the user clicks "Export Session"
  Then the export shall succeed
  And "rounds" shall be an empty array
  And "relianceScores" shall be an empty array
  And "sessionMetadata.totalRounds" shall be 0
  And "sessionMetadata.finalSessionScore" shall be null
  And "documentState" shall contain the user-written text
```

---

## AC-007: Low-Confidence Display for Limited Data

**Requirement:** REQ-AWARE-011

```gherkin
Scenario: Short session shows low-confidence indicator
  Given the user has completed only 1 round
  When the indicator displays the session score
  Then a "Low confidence" label shall appear below the percentage
  And if the overlay is active, segment colors shall use the neutral (yellow) range
  And extreme warm or cool colors shall not be applied
```

```gherkin
Scenario: Low-confidence indicator removed after sufficient rounds
  Given the user has completed 1 round and the low-confidence label is visible
  When the user completes a 2nd round
  Then the "Low confidence" label shall be removed
  And the full color range (Level 1-5) shall be available for overlay rendering
```

---

## AC-008: Temporal Pattern Tracking

**Requirement:** REQ-AWARE-012

```gherkin
Scenario: Temporal metrics are captured for each round
  Given the user is in a marking-regeneration round
  And the user spends 30 seconds reading text before first mark
  And the user revisits 2 previously marked segments
  And the user responds to pushback after 5 seconds
  When the round completes
  Then the temporal tracker shall report dwellTimeMs > 0
  And the temporal tracker shall report decisionLatencyMs > 0
  And the temporal tracker shall report revisitCount as 2
  And the temporal tracker shall report pushbackResponseTimeMs approximately 5000
  And the temporal tracker shall report roundDurationMs > 0
```

```gherkin
Scenario: Temporal tracking pauses when browser tab is not focused
  Given the user is in the middle of a round
  When the user switches to another browser tab for 60 seconds
  And then returns to the CoWriThink tab
  Then the dwell time for the unfocused period shall not be counted
  And the temporal metrics shall reflect only active engagement time
```

---

## AC-009: Assessment Result Caching

**Requirement:** REQ-AWARE-013

```gherkin
Scenario: Cached results prevent redundant API calls
  Given Round 1 has been assessed and the result is cached
  And the user toggles the overlay off and then on again
  When the overlay renders
  Then no new LLM API call shall be made for Round 1
  And the cached assessment result shall be used for rendering
```

```gherkin
Scenario: Cache persists across overlay toggles
  Given the user has toggled the overlay on, then off, then on again
  When the overlay renders for the second activation
  Then all previously cached round assessments shall be available
  And overlay rendering shall complete within 200ms using cached data
```

---

## Quality Gate Criteria

### Functional Completeness

- [ ] Always-on indicator displays "--" before AI interaction, percentage after
- [ ] Indicator updates within 500ms of assessment result
- [ ] Color overlay toggles on/off via indicator click
- [ ] Overlay colors correctly map to 5 reliance levels
- [ ] Per-round assessment evaluates all 4 dimensions
- [ ] Synthesis rules enforced (Level 5 dimension -> at least Level 4 round)
- [ ] Round History panel shows all rounds with levels
- [ ] Round detail drill-down displays all relevant data
- [ ] Session export produces valid JSON with all required fields
- [ ] Low-confidence display for fewer than 2 rounds
- [ ] Temporal pattern tracking captures all specified metrics

### Performance Criteria

- [ ] LLM assessment completes within 3 seconds per round
- [ ] Indicator update within 500ms of assessment completion
- [ ] Overlay render within 200ms using cached data
- [ ] Export completes within 2 seconds for sessions up to 20 rounds

### Error Handling

- [ ] Malformed LLM response triggers retry then default Level 3
- [ ] API timeout displays previous score with "updating..." label
- [ ] localStorage capacity warning at 4MB usage
- [ ] Tab unfocus pauses temporal tracking correctly

### Definition of Done

- All acceptance scenarios pass manual verification
- LLM assessment prompt produces consistent results for reference test cases
- Export JSON validates against the defined schema
- Color overlay renders correctly on segments of all 5 levels
- Temporal tracker accurately captures dwell time and revisit counts
- Round History panel updates in real-time after each assessment
- All edge cases (short session, no AI interaction, malformed response) handled
- Code follows project standards (TypeScript, React 19 patterns, Tailwind CSS)
