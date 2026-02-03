# SPEC-AWARE-001: Implementation Plan

**SPEC Reference:** SPEC-AWARE-001 - Reliance Assessment & Awareness Layer
**Tags:** SPEC-AWARE-001, awareness, reliance-assessment, overlay, export

---

## 1. Implementation Overview

The Awareness Layer consists of five major subsystems that must be implemented in dependency order:

1. **Temporal Pattern Tracker** - Browser event instrumentation for dwell time and interaction timing
2. **LLM Assessment Service** - GPT-4o integration with rubric prompt and structured output
3. **Always-On Indicator Component** - Persistent UI element with session score calculation
4. **Color Overlay Extension** - TipTap decoration for text-level coloring
5. **Round History & Export** - Side panel component and JSON export functionality

---

## 2. Milestones

### Primary Goal: Core Assessment Pipeline

Implement the end-to-end path from round completion to displayed score.

**Deliverables:**
- Temporal pattern tracker capturing dwell time, decision latency, and round duration
- LLM assessment service with GPT-4o integration and structured JSON response parsing
- Assessment result cache (in-memory + localStorage persistence)
- Session-level score calculation with recency-weighted averaging
- Always-on indicator component rendering percentage or "--" state

**Dependencies:**
- SPEC-CORE-001: Provenance store must be operational and logging events
- SPEC-INTERACT-001: Round completion signal must be emitted after each regeneration cycle

**Acceptance Gate:** After a regeneration cycle, the indicator updates from "--" to a numeric percentage within 3 seconds.

---

### Secondary Goal: Color Overlay & Round History

Implement the detailed visualization and history components.

**Deliverables:**
- TipTap decoration extension for color overlay rendering
- Overlay toggle behavior (click indicator to activate/deactivate)
- Color mapping from reliance levels to CSS custom properties
- Round History panel component with chronological list and dot indicators
- Round detail drill-down with expandable sections

**Dependencies:**
- Primary Goal must be complete (assessment results must exist to display)

**Acceptance Gate:** User can toggle overlay on/off, see correct segment coloring, and drill into round details.

---

### Final Goal: Export & Edge Cases

Implement session export and handle all edge cases.

**Deliverables:**
- Session export service serializing all session data to JSON
- Export button triggering file download with correct naming convention
- Low-confidence display for sessions with fewer than 2 rounds
- Loading states for indicator (during assessment) and overlay (during toggle)
- localStorage size warning when approaching 4MB

**Dependencies:**
- Secondary Goal must be complete

**Acceptance Gate:** Export produces valid JSON with all required fields; short sessions show low-confidence indicator.

---

### Optional Goal: Performance Optimization

Optimize for cost and latency in the assessment pipeline.

**Deliverables:**
- Request batching for overlay activation (batch assess uncached rounds)
- Token usage optimization in LLM prompts (compress interaction history for long sessions)
- Lazy overlay rendering (only decorate visible viewport segments)

---

## 3. LLM Assessment Prompt Design

### 3.1 System Prompt Architecture

The assessment prompt is structured as a system message containing the full rubric, followed by a user message containing the round-specific data.

**System Message Structure:**

```
Role: You are evaluating a user's engagement in a round of human-AI co-writing.
Your task is to assess the user's reliance on AI by examining their behavior.

RUBRIC:
Level 5 (Writer-Driven): User typed from scratch or substantially rewrote AI
text. Specific, constrained requests. Deliberate engagement with pushback.
Edits changed meaning/direction.

Level 4 (Actively Shaped): Multiple deliberate marks (preserve/delete/edit
mix). Directed requests. Thoughtful pushback response. Beyond-surface editing.

Level 3 (Selectively Engaged): Some marks and minor edits. Moderately specific
requests. Paused to read before marking. Quick but present pushback engagement.

Level 2 (Superficially Engaged): Brief dwell time. Surface-level marks (word
swaps). Vague requests. Instant pushback dismissal. No meaning changes.

Level 1 (Minimal Engagement): Near-zero dwell time. No or negligible marks.
No edits. Absent or empty requests. Accepted AI output without reading.

ASSESSMENT DIMENSIONS:
1. Marking Behavior: What marks did the user make? What granularity? Selective?
2. Request Quality: How specific were AI requests? Goal reference? Constraints?
3. Editing Depth: Did edits change meaning, or only surface form?
4. Temporal Patterns: Dwell time? Revisits? Deliberate pace?

SYNTHESIS RULES (MANDATORY):
- The final level is NOT an average of dimension scores
- If ANY dimension is Level 5, the round MUST be at least Level 4
- If ALL dimensions are Level 1, the round MUST be Level 1
- For mixed dimensions, weigh the most informative signals

OUTPUT FORMAT (strict JSON, no additional text):
{
  "level": <1-5>,
  "dimension_scores": {
    "marking_behavior": <1-5>,
    "request_quality": <1-5>,
    "editing_depth": <1-5>,
    "temporal_patterns": <1-5>
  },
  "justification": "<2-3 sentences explaining the assessment>"
}
```

**User Message Structure:**

```
CONTEXT:
- Writing goal: {current_goal}
- Round number: {round_number}
- Total rounds so far: {total_rounds}

THIS ROUND'S EVENTS:
- Marks applied: {marks_summary}
- Request text: "{request_text}"
- Edits made: {edits_summary}
- Pushback shown: {pushback_events}
- Pushback response: {pushback_response}
- Timing data:
  - Round duration: {round_duration_ms}ms
  - Dwell time before first action: {dwell_time_ms}ms
  - Decision latency (generation to first interaction): {decision_latency_ms}ms
  - Pushback response time: {pushback_response_time_ms}ms
  - Segments revisited: {revisit_count}

PREVIOUS ROUNDS CONTEXT (summary):
{previous_rounds_summary}
```

### 3.2 Structured Output Enforcement

- Use OpenAI's `response_format: { type: "json_object" }` parameter
- Validate response against a Zod schema on the client side
- If validation fails, retry once with a clarification prompt
- If second attempt fails, assign a default Level 3 (neutral) and log the failure

### 3.3 Prompt Token Budget

| Component                    | Estimated Tokens |
|------------------------------|------------------|
| System prompt (rubric)       | ~600             |
| Round events (typical)       | ~300-500         |
| Previous rounds summary      | ~200-400         |
| **Total input per call**     | **~1,100-1,500** |
| Output                       | ~100-150         |

At GPT-4o pricing, each assessment call costs approximately $0.005-0.01.

---

## 4. Temporal Pattern Tracking Implementation

### 4.1 Browser Event Instrumentation

**Events to Capture:**

| Event                    | Browser API                  | Data Captured                  |
|--------------------------|------------------------------|--------------------------------|
| Segment focus            | `mouseenter` on TipTap node  | Segment ID, timestamp          |
| Segment leave            | `mouseleave` on TipTap node  | Segment ID, timestamp, delta   |
| First mark in round      | Custom event from marking    | Timestamp (round start)        |
| Regenerate click         | Button click handler         | Timestamp (round end)          |
| AI generation displayed  | Generation complete callback | Timestamp                      |
| First post-gen interaction | First mark/edit after gen  | Timestamp, delta from gen      |
| Pushback display         | Pushback render callback     | Timestamp                      |
| Pushback response        | Button click handler         | Timestamp, choice, delta       |

### 4.2 Derived Metrics Calculation

```typescript
interface TemporalMetrics {
  roundDurationMs: number;          // regenerateClick - firstMarkTimestamp
  dwellTimeMs: number;              // avg time spent on segments before acting
  decisionLatencyMs: number;        // firstPostGenInteraction - aiGenerationDisplayed
  pushbackResponseTimeMs: number;   // pushbackResponse - pushbackDisplay (or null)
  revisitCount: number;             // count of segments visited more than once
  averageSegmentDwellMs: number;    // mean dwell per segment interaction
}
```

### 4.3 Implementation Approach

- Create a `TemporalTracker` class that subscribes to editor events
- The tracker maintains a running state per round (start time, segment visit log, interaction timestamps)
- On round completion (regenerate click), the tracker computes all derived metrics and emits a `temporal-metrics-ready` event
- The metrics are included in the round data package sent to the LLM assessment service
- The tracker resets for each new round

---

## 5. Score Aggregation: Recency-Weighted Average

### 5.1 Formula

```
session_score = SUM(round_score[i] * weight[i]) / SUM(weight[i])

weight[i] = 1 + (i / total_rounds) * 0.5

where i is 1-indexed (round 1 = first round)
```

### 5.2 Example Calculation

| Round | Score | Weight                  | Weighted Score |
|-------|-------|-------------------------|----------------|
| 1     | 2     | 1 + (1/4)*0.5 = 1.125  | 2.25           |
| 2     | 3     | 1 + (2/4)*0.5 = 1.25   | 3.75           |
| 3     | 4     | 1 + (3/4)*0.5 = 1.375  | 5.50           |
| 4     | 3     | 1 + (4/4)*0.5 = 1.5    | 4.50           |
| **Sum** |     | **5.25**                | **16.00**      |

Session score = 16.00 / 5.25 = 3.05
Display percentage = (3.05 / 5) * 100 = 61%

### 5.3 Properties

- Recent rounds carry up to 50% more weight than the first round
- The weighting is mild: it biases toward current behavior without erasing early rounds
- A single high-engagement round at the end meaningfully lifts the score
- A single low-engagement round does not catastrophically drop it

---

## 6. TipTap Decoration Extension for Color Overlay

### 6.1 Extension Architecture

Create a custom TipTap extension `AwarenessOverlay` that:

1. Reads the current assessment data (per-segment reliance levels)
2. Creates ProseMirror `Decoration.inline` objects for each assessed segment
3. Applies CSS classes corresponding to the reliance level (e.g., `aware-level-3`)
4. Listens for overlay toggle state and adds/removes decorations accordingly

### 6.2 Decoration Mapping

```typescript
function createOverlayDecorations(
  doc: ProseMirrorNode,
  segmentScores: SegmentScore[]
): DecorationSet {
  const decorations: Decoration[] = [];

  for (const segment of segmentScores) {
    decorations.push(
      Decoration.inline(segment.spanStart, segment.spanEnd, {
        class: `aware-level-${segment.level}`,
        'data-aware-level': String(segment.level),
        'data-aware-name': segment.levelName,
      })
    );
  }

  return DecorationSet.create(doc, decorations);
}
```

### 6.3 CSS Custom Properties

```css
:root {
  --aware-level-5: rgba(230, 126, 34, 0.25);   /* deep warm - dark orange */
  --aware-level-4: rgba(243, 156, 18, 0.25);    /* warm - orange */
  --aware-level-3: rgba(241, 196, 15, 0.25);    /* neutral - yellow */
  --aware-level-2: rgba(52, 152, 219, 0.20);    /* cool - light blue */
  --aware-level-1: rgba(149, 165, 166, 0.25);   /* deep cool - gray */
}
```

### 6.4 Segment-to-Level Resolution

Each text segment's overlay color is determined by:
1. Finding the most recent round that produced or modified that segment
2. Using that round's assessed level as the segment's color
3. User-written text (never touched by AI) receives no overlay

---

## 7. Round History Component Design

### 7.1 Component Structure

```
RoundHistoryPanel
  +-- RoundHistoryList
       +-- RoundHistoryItem (per round)
            +-- RoundNumber (e.g., "Round 3")
            +-- LevelDots (filled/empty dots for level 1-5)
            +-- LevelName (e.g., "Selectively Engaged")
            +-- RoundDetailExpander (click to expand)
                 +-- SegmentsMarkedSummary
                 +-- RequestText
                 +-- GeneratedTextPreview
                 +-- DimensionScoresTable
                 +-- JustificationText
```

### 7.2 State Management

- Round history data is derived from the assessment result cache
- Each new round assessment triggers a state update that prepends to the list
- Expanded/collapsed state is tracked per item in local component state
- The panel is always visible in the side panel (scrollable if many rounds)

---

## 8. Export Format Specification

### 8.1 JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["sessionId", "exportedAt", "goal", "documentState", "provenanceLog", "rounds", "sessionMetadata"],
  "properties": {
    "sessionId": { "type": "string", "format": "uuid" },
    "exportedAt": { "type": "string", "format": "date-time" },
    "goal": { "type": "string" },
    "goalHistory": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "text": { "type": "string" },
          "changedAt": { "type": "string", "format": "date-time" },
          "source": { "type": "string", "enum": ["manual", "process2", "initial"] }
        }
      }
    },
    "documentState": {
      "type": "object",
      "properties": {
        "plainText": { "type": "string" },
        "html": { "type": "string" },
        "wordCount": { "type": "integer" }
      }
    },
    "provenanceLog": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string" },
          "timestamp": { "type": "number" },
          "data": { "type": "object" }
        }
      }
    },
    "rounds": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "roundNumber": { "type": "integer" },
          "level": { "type": "integer", "minimum": 1, "maximum": 5 },
          "dimensionScores": {
            "type": "object",
            "properties": {
              "markingBehavior": { "type": "integer" },
              "requestQuality": { "type": "integer" },
              "editingDepth": { "type": "integer" },
              "temporalPatterns": { "type": "integer" }
            }
          },
          "justification": { "type": "string" },
          "temporalMetrics": { "type": "object" },
          "events": { "type": "array" }
        }
      }
    },
    "relianceScores": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "spanStart": { "type": "integer" },
          "spanEnd": { "type": "integer" },
          "text": { "type": "string" },
          "level": { "type": "integer" },
          "levelName": { "type": "string" },
          "roundNumber": { "type": "integer" }
        }
      }
    },
    "sessionMetadata": {
      "type": "object",
      "properties": {
        "sessionDuration": { "type": "number" },
        "totalRounds": { "type": "integer" },
        "finalSessionScore": { "type": "number" },
        "finalPercentage": { "type": "number" },
        "startedAt": { "type": "string", "format": "date-time" }
      }
    }
  }
}
```

### 8.2 File Download Implementation

- Use the browser `Blob` API to create a JSON blob
- Generate a download link with `URL.createObjectURL`
- Trigger download programmatically via a hidden anchor element
- File name format: `cowrithink-session-{sessionId}-{YYYY-MM-DD}.json`

---

## 9. Cost Optimization Strategy

### 9.1 Assessment Call Reduction

| Strategy                     | Description                                           | Savings     |
|------------------------------|-------------------------------------------------------|-------------|
| Cache round results          | Never re-assess a completed round                     | High        |
| Batch overlay assessment     | When overlay toggled on, assess all uncached rounds in one call | Medium |
| Compress history             | For rounds > 5, summarize earlier round data          | Medium      |
| Skip identical rounds        | If round events are identical to previous, reuse score | Low (rare) |

### 9.2 Token Optimization

- For sessions with > 10 rounds, compress the "previous rounds summary" to last 3 rounds + statistical summary of earlier rounds
- Use compact event representations (abbreviations, counts instead of full logs)
- Target: keep each assessment call under 2,000 input tokens

### 9.3 Estimated Cost Per Session

| Scenario              | Rounds | Calls | Est. Cost |
|-----------------------|--------|-------|-----------|
| Short study session   | 3-5    | 3-5   | $0.02-0.05 |
| Medium session        | 8-12   | 8-12  | $0.05-0.12 |
| Long session          | 15-20  | 15-20 | $0.10-0.20 |

---

## 10. Risk Analysis

### Risk 1: LLM Assessment Latency

**Risk:** GPT-4o response time exceeds 3 seconds, causing noticeable UI lag after regeneration.

**Likelihood:** Medium

**Mitigation:**
- Fire assessment call asynchronously (do not block the diff display)
- Show indicator loading state while assessment runs
- If assessment takes > 5 seconds, display the previous score with a "updating..." label
- Consider pre-computing partial scores from temporal data while awaiting LLM response

---

### Risk 2: Assessment Quality Inconsistency

**Risk:** GPT-4o produces inconsistent or unreliable scores for similar interaction patterns.

**Likelihood:** Medium

**Mitigation:**
- Include concrete examples in the system prompt for each level
- Enforce synthesis rules as explicit constraints in the prompt
- Validate output against the Zod schema; reject and retry malformed responses
- Log all assessments for offline analysis during the study

---

### Risk 3: localStorage Capacity

**Risk:** Long sessions with many rounds generate provenance data exceeding localStorage limits (typically 5-10MB).

**Likelihood:** Low (prototype sessions expected to be 15-30 minutes)

**Mitigation:**
- Monitor localStorage usage and warn at 4MB
- Offer early export if approaching limit
- Compress provenance log entries (remove redundant fields, use compact timestamps)

---

### Risk 4: Overlay Performance with Large Documents

**Risk:** Rendering color decorations on 3000+ word documents causes editor lag.

**Likelihood:** Low

**Mitigation:**
- Use ProseMirror's efficient decoration system (DecorationSet with proper mapping)
- Only decorate segments that have AI interaction history (user-only text has no overlay)
- Consider viewport-aware lazy decoration for very large documents

---

### Risk 5: Temporal Pattern Accuracy

**Risk:** Browser event timing may be inaccurate due to tab switching, window focus changes, or system sleep.

**Likelihood:** Medium

**Mitigation:**
- Track `visibilitychange` and `focus`/`blur` events to pause timing during inactive periods
- Discard dwell time measurements when tab was not focused
- Record raw timestamps and compute deltas server-side during study analysis
