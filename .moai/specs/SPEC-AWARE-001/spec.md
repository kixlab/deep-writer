# SPEC-AWARE-001: Reliance Assessment & Awareness Layer

---
id: SPEC-AWARE-001
version: 1.0.0
status: draft
created: 2026-02-03
updated: 2026-02-03
author: Dr.WriThink
priority: P1
depends_on:
  - SPEC-CORE-001
  - SPEC-INTERACT-001
  - SPEC-GUARD-001
tags:
  - awareness
  - reliance-assessment
  - overlay
  - export
  - llm-assessment
---

## HISTORY

| Version | Date       | Author      | Description                                  |
|---------|------------|-------------|----------------------------------------------|
| 1.0.0   | 2026-02-03 | Dr.WriThink | Initial SPEC creation for Awareness Layer    |

---

## 1. Environment

### 1.1 Project Context

CoWriThink is an AI-assisted writing tool designed to promote writer autonomy rather than passive AI reliance. The Awareness Layer provides users with real-time feedback on their engagement patterns across the writing session, enabling self-reflection on how they interact with AI-generated content.

### 1.2 System Context

- **Application**: Next.js 15 App Router with React 19
- **Editor**: TipTap/ProseMirror rich text editor
- **Styling**: Tailwind CSS
- **Storage**: localStorage for prototype persistence
- **LLM Provider**: OpenAI GPT-4o for reliance assessment
- **Project Type**: Greenfield prototype for user study

### 1.3 Dependencies

| Dependency       | SPEC ID           | Required Capability                                    |
|------------------|-------------------|--------------------------------------------------------|
| Core Editor      | SPEC-CORE-001     | Text segment state tracking, provenance store, editor infrastructure |
| Interaction      | SPEC-INTERACT-001 | Marking/regeneration cycle events, round completion signals |
| Guarded Compliance | SPEC-GUARD-001  | Pushback event data (user responses to pushback for assessment input) |

---

## 2. Assumptions

### 2.1 Technical Assumptions

- **A1**: The provenance store (SPEC-CORE-001) reliably logs all interaction events with timestamps, including marking actions, edit events, generation requests, and pushback responses.
- **A2**: OpenAI GPT-4o API is available and responds within acceptable latency (target < 3 seconds for assessment calls).
- **A3**: Browser event APIs provide sufficient resolution for dwell time measurement (timestamps accurate to millisecond level).
- **A4**: localStorage provides adequate capacity for session data in prototype scope (sessions under 5MB).
- **A5**: TipTap supports custom decoration extensions for rendering color overlays on text segments.

### 2.2 Design Assumptions

- **A6**: Users will interact with the writing tool through mouse-only input (no keyboard shortcuts in prototype).
- **A7**: The reliance assessment rubric (5 levels, 4 dimensions) is sufficient to capture meaningful differences in user engagement.
- **A8**: Recency-weighted averaging provides a reasonable session-level score without over-penalizing early low-engagement rounds.
- **A9**: Users may or may not toggle the detailed overlay; the always-on indicator must provide value independently.

### 2.3 Study Assumptions

- **A10**: This is a v1 prototype for a user study; no dispute mechanism for scores is required.
- **A11**: Session export data will be analyzed offline by researchers; the export format must be machine-parseable JSON.

---

## 3. Requirements

### REQ-AWARE-001: Always-On Reliance Indicator Display (Ubiquitous)

The system **shall** display a reliance indicator bar in the top-right corner of the editor at all times during an active writing session.

**Details:**
- The indicator displays a percentage value (0-100%) representing the session-level reliance score
- Higher percentage indicates greater user involvement
- The indicator occupies a fixed position that does not interfere with the editor content area
- The indicator is a small horizontal bar with fill level corresponding to the percentage

**Traceability:** DR1 (Reliance Awareness)

---

### REQ-AWARE-002: Indicator Default State Before AI Interaction (State-Driven)

**While** no AI interaction has occurred in the current session, the system **shall** display "--" in the reliance indicator instead of a percentage value.

**Details:**
- "--" is displayed from session start until the first regeneration cycle completes
- No color fill is shown on the indicator bar in this state
- Once the first assessment completes, "--" is permanently replaced with a numeric percentage for the remainder of the session

**Traceability:** DR1 (Reliance Awareness), Edge Case E9

---

### REQ-AWARE-003: Indicator Update After Regeneration (Event-Driven)

**When** a regeneration cycle completes and the round-level LLM assessment returns a result, the system **shall** recalculate the session-level reliance score and update the always-on indicator with the new percentage.

**Details:**
- The session-level score is a recency-weighted average of all round scores
- Formula: `session_score = SUM(round_score_i * recency_weight_i) / SUM(recency_weight_i)`
- Recency weight for round i: `1 + (i / total_rounds) * 0.5`
- Displayed percentage: `(session_score / 5) * 100`
- The indicator updates within 500ms of receiving the assessment result
- During the assessment API call, the indicator shows a brief loading state

**Traceability:** DR1 (Reliance Awareness)

---

### REQ-AWARE-004: Color Overlay Toggle (Event-Driven)

**When** the user clicks the reliance indicator, the system **shall** toggle the text-level color overlay on or off.

**Details:**
- First click activates the overlay; subsequent clicks toggle it
- When activating, the system runs a full LLM assessment if stale data exists, or uses cached assessment if current
- When deactivating, the overlay colors are removed and the editor returns to normal display
- The indicator visually reflects the active/inactive state of the overlay (e.g., highlighted border when active)
- The toggle event is logged in the provenance store

**Traceability:** DR1 (Reliance Awareness), DR3 (Reflective Space)

---

### REQ-AWARE-005: Color Overlay Rendering (State-Driven)

**While** the color overlay is active, the system **shall** render each text segment with a background color corresponding to the reliance level of the most recent round that produced or modified that segment.

**Color Mapping:**

| Level | Name                | Color              | CSS Variable                |
|-------|---------------------|--------------------|-----------------------------|
| 5     | Writer-driven       | Deep warm (dark orange) | `--aware-level-5`     |
| 4     | Actively shaped     | Warm (orange)      | `--aware-level-4`           |
| 3     | Selectively engaged | Neutral (yellow)   | `--aware-level-3`           |
| 2     | Superficially engaged | Cool (light blue) | `--aware-level-2`          |
| 1     | Minimal engagement  | Deep cool (gray)   | `--aware-level-1`           |

**Details:**
- Colors are applied as semi-transparent background overlays that do not obscure text readability
- User-written text (never touched by AI) receives no overlay color
- Segment boundaries align with the spans tracked by the provenance store
- The overlay is implemented as a TipTap decoration extension

**Traceability:** DR1 (Reliance Awareness), DR3 (Reflective Space)

---

### REQ-AWARE-006: Per-Round LLM Assessment (Event-Driven)

**When** a regeneration cycle completes, the system **shall** invoke an LLM assessment that evaluates the user's engagement for that round across four dimensions and produces a level (1-5) with justification.

**Four Assessment Dimensions:**

1. **Marking Behavior**: action taken, granularity of marks, review evidence
2. **Request Quality**: specificity of AI requests, goal reference, constraint setting
3. **Editing Depth**: modification extent, pushback response, post-generation editing
4. **Temporal Patterns**: dwell time before actions, consistency of engagement, return visits to earlier segments

**LLM Input:**
- Writing goal (current)
- Round number
- Full interaction history up to and including this round (from provenance store)
- This round's specific events (marks, requests, edits, timing data)

**LLM Output (structured JSON):**
```json
{
  "level": 3,
  "dimension_scores": {
    "marking_behavior": 3,
    "request_quality": 2,
    "editing_depth": 4,
    "temporal_patterns": 3
  },
  "justification": "User made selective marks and edited one clause..."
}
```

**Traceability:** DR1 (Reliance Awareness)

---

### REQ-AWARE-007: Assessment Synthesis Rules (Ubiquitous)

The system **shall** apply the following synthesis rules when the LLM produces a round-level assessment:

- The final round level is **not** a simple arithmetic average of the four dimension scores
- **If any dimension is Level 5**, the round level **shall** be at least Level 4
- **If all dimensions are Level 1**, the round level **shall** be Level 1
- **For mixed dimensions**, the LLM weighs the most informative signals for that round to determine the overall character of engagement

These rules are encoded in the LLM system prompt as mandatory constraints.

**Traceability:** DR1 (Reliance Awareness)

---

### REQ-AWARE-008: Round History Panel (Ubiquitous)

The system **shall** display a Round History section in the side panel showing a chronological list of all completed marking-regeneration rounds.

**Details:**
- Each entry displays: round number, reliance level as 1-5 filled dots, and level name
- Rounds are listed in reverse chronological order (most recent at top)
- The panel updates in real-time as new rounds complete

**Traceability:** DR1 (Reliance Awareness), DR3 (Reflective Space)

---

### REQ-AWARE-009: Round Detail Drill-Down (Event-Driven)

**When** the user clicks a round entry in the Round History panel, the system **shall** display detail information for that round including: segments marked, marking actions taken, request text sent, AI text generated, dimension scores, and justification.

**Details:**
- Detail view appears inline below the clicked round entry or as an expandable section
- The detail includes the LLM justification text explaining the assessment
- Clicking the same round again collapses the detail view

**Traceability:** DR1 (Reliance Awareness), DR3 (Reflective Space)

---

### REQ-AWARE-010: Session Export (Event-Driven)

**When** the user clicks the "Export Session" button, the system **shall** download a JSON file containing the complete session data.

**Required JSON Fields:**

| Field               | Description                                              |
|---------------------|----------------------------------------------------------|
| `sessionId`         | Unique session identifier                                |
| `exportedAt`        | ISO 8601 timestamp of export                             |
| `goal`              | Current writing goal text                                |
| `goalHistory`       | Array of goal changes with timestamps and sources        |
| `documentState`     | Final document content as plain text and structured HTML |
| `provenanceLog`     | Complete array of all provenance events                  |
| `rounds`            | Array of round objects with assessment results           |
| `relianceScores`    | Array of per-segment reliance scores                     |
| `sessionMetadata`   | Session duration, total rounds, final session score      |

**File Naming:** `cowrithink-session-{sessionId}-{date}.json`

**Traceability:** DR1 (Reliance Awareness), Study Data Collection

---

### REQ-AWARE-011: Low-Confidence Display for Limited Data (State-Driven)

**While** the session has fewer than 2 completed rounds, the system **shall** display reliance scores with a visual low-confidence indicator and use neutral colors in the overlay.

**Details:**
- A small "Low confidence" label appears below the indicator percentage
- Overlay colors default to the neutral (yellow) range rather than extreme warm or cool
- After 2 or more rounds complete, the low-confidence indicator is removed and full color range is used
- This prevents misleading scores from insufficient data

**Traceability:** Edge Case: Very Short Session

---

### REQ-AWARE-012: Temporal Pattern Instrumentation (Ubiquitous)

The system **shall** instrument browser-level events to capture temporal patterns required for Dimension 4 (Temporal Patterns) of the reliance assessment.

**Captured Metrics:**
- Dwell time: duration between text segment receiving focus and user taking action
- Decision latency: time between AI generation appearing and user's first interaction
- Pushback response time: time between pushback warning display and user's response
- Return visits: count of cursor revisits to previously marked segments within a round
- Overall round duration: time from round start (first mark) to round end (regenerate click)

**Traceability:** DR1 (Reliance Awareness), REQ-AWARE-006

---

### REQ-AWARE-013: Assessment Result Caching (Ubiquitous)

The system **shall** cache the most recent LLM assessment result for each round to avoid redundant API calls when the user toggles the overlay.

**Details:**
- Cached results are stored in memory and persisted to localStorage
- A cached result is considered valid until the round data changes (which does not happen after a round completes)
- When the user toggles the overlay on, the system uses cached results if available rather than re-invoking the LLM
- Cache is cleared only when a new session starts

**Traceability:** Cost Optimization, Performance

---

## 4. Specifications

### 4.1 Technical Constraints

| Constraint          | Value                                                   |
|---------------------|---------------------------------------------------------|
| LLM API             | OpenAI GPT-4o via REST API                              |
| Assessment latency  | Target < 3 seconds per round assessment                 |
| Indicator update    | Within 500ms of assessment result                       |
| Overlay rendering   | Within 200ms of toggle action (using cached data)       |
| Export file size     | No hard limit; warn if session data exceeds 4MB         |
| Color accessibility | Warm/cool spectrum must maintain WCAG 2.1 AA contrast ratio against white text background |

### 4.2 Data Flow

```
Provenance Store (SPEC-CORE-001)
       |
       v
Round Event Aggregator  -->  Temporal Pattern Tracker
       |                            |
       v                            v
   Round Data Package (events + timing)
       |
       v
LLM Assessment Service (GPT-4o)
       |
       v
Assessment Result Cache
       |
       +---> Always-On Indicator (session score calculation)
       |
       +---> Color Overlay Renderer (TipTap decoration)
       |
       +---> Round History Panel (display)
       |
       +---> Session Export (JSON serialization)
```

### 4.3 LLM Assessment System Prompt Structure

The system prompt sent to GPT-4o includes:
1. Assessor role definition
2. The complete 5-level rubric with behavioral evidence descriptions
3. The 4-dimension evaluation framework with scoring guidelines
4. Synthesis rules as mandatory constraints
5. Required JSON output schema
6. The current writing goal, round number, and interaction history

### 4.4 Scope Boundaries

**In Scope:**
- Always-on indicator with percentage display
- Text-level color overlay toggle
- Per-round LLM assessment with 4 dimensions
- Round history panel with drill-down
- Session export as JSON
- Temporal pattern instrumentation
- Assessment result caching

**Out of Scope (Deferred to Post-Study):**
- Score dispute mechanism
- Learning from user overrides
- Keyboard shortcuts for overlay toggle
- Cross-session score comparison
- Assessment accuracy validation (handled via study interviews)
