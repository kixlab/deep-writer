# CoWriThink: Reliance Assessment Criteria

Detailed rubric for LLM-based assessment of user involvement per interaction round.

---

## Overview

| Aspect | Decision |
|--------|----------|
| **Levels** | 5 (Writer-driven → Minimal) |
| **Unit** | Per interaction round (one marking-regeneration cycle) |
| **Evidence** | Full interaction history up to that point |
| **Assessor** | LLM (GPT-4o) with this rubric as system prompt |
| **Output** | Level (1-5) + justification per round |

---

## The 5 Levels

### Level 5: Writer-Driven

**Color:** Deep warm (dark orange/red)

The user is the primary author in this round. AI serves as a minor tool.

**Behavioral evidence:**
- User typed substantial text from scratch (not from AI generation)
- OR user substantially rewrote AI text in-place (restructured sentences, changed argument direction, not just word swaps)
- Requests to AI were specific and constrained ("Shorten this to 2 sentences, preserve the metaphor about erosion")
- User engaged with pushback thoughtfully (accepted some, rejected some with apparent reasoning)
- User's edits changed the meaning or direction of the text, not just surface polish

**Example:**
> User receives AI paragraph about AI in education. Double-clicks and rewrites the opening sentence from scratch. Deletes two AI phrases and replaces them with their own argument. Asks AI to "rephrase only the transition sentence to connect my point about critical thinking to the next paragraph." Accepts pushback on a vague claim and strengthens it.

---

### Level 4: Actively Shaped

**Color:** Warm (orange)

The user meaningfully directed the AI's contribution. The result reflects the user's judgment.

**Behavioral evidence:**
- User made multiple deliberate marks (mix of preserve, delete, edit)
- Marking showed selectivity -- not bulk accept or bulk delete, but phrase-level choices
- Requests showed direction ("Make this more concise" or "Strengthen the argument here")
- User responded to pushback (either accepting or overriding with apparent consideration -- not instant dismissal)
- Editing was beyond surface level: rephrased clauses, reorganized ideas, cut redundancy

**Example:**
> User preserves the AI's opening claim but deletes two supporting sentences they find weak. Edits "important" to "critical" and rephrases the conclusion. Asks AI to "add a specific example of AI in the classroom." Reviews the Process 2 suggestion and selects a refined direction.

---

### Level 3: Selectively Engaged

**Color:** Neutral (yellow)

The user reviewed AI output and made some decisions, but engagement was moderate.

**Behavioral evidence:**
- User made some marks (preserve/delete) but edits were minor (word-level changes, not structural)
- Requests were moderately specific ("Improve this paragraph" -- direction given but not detailed constraints)
- User paused to read AI text before marking (non-trivial dwell time)
- Some segments preserved after apparent review, others deleted
- Pushback was addressed but quickly (accept/reject without deliberation)

**Example:**
> User reads AI paragraph, deletes one sentence, preserves the rest. Changes "utilize" to "use." Asks AI to "make the second paragraph stronger." Accepts a pushback suggestion without editing further.

---

### Level 2: Superficially Engaged

**Color:** Cool (light blue)

The user interacted with the text but without clear depth or purpose.

**Behavioral evidence:**
- User paused briefly before acting (short dwell time -- skimming, not reading)
- Marks were surface-level: a few word swaps, one or two quick deletions
- Requests were vague ("Make it better," "Fix this")
- Pushback was dismissed quickly ("Keep anyway" with near-instant click)
- No structural changes, no argument-level decisions
- Edits did not change meaning -- only cosmetic (synonym swaps, punctuation)

**Example:**
> User glances at AI paragraph, changes "however" to "but" and "significant" to "major." Preserves everything else. Asks AI to "improve the flow." Clicks "Keep anyway" on a pushback warning within 2 seconds of it appearing.

---

### Level 1: Minimal Engagement

**Color:** Deep cool (gray/dark blue)

The user showed near-zero cognitive engagement. AI output was accepted as-is or with negligible interaction.

**Behavioral evidence:**
- User clicked Regenerate with no or almost no marking
- Near-zero dwell time on AI-generated text (accepted without reading)
- No edits in-place
- Requests were absent or empty ("Continue," "More")
- Pushback was auto-dismissed or ignored
- No evidence of the user reading, evaluating, or considering the text

**Example:**
> AI generates a paragraph. User immediately clicks to the next section without marking anything. OR user generates, waits 1-2 seconds, preserves everything, and moves on. No edits, no deletions, no engagement with pushback.

---

## Assessment Dimensions

The LLM evaluates each round across four dimensions, then synthesizes into a single level.

### Dimension 1: Marking Behavior

| Evidence | Score contribution |
|----------|-------------------|
| No marks at all | → Level 1 |
| A few quick marks, no edits | → Level 2 |
| Selective marks with some edits | → Level 3 |
| Deliberate mix of preserve/delete/edit | → Level 4 |
| Substantial rewriting or typing from scratch | → Level 5 |

### Dimension 2: Request Quality

| Evidence | Score contribution |
|----------|-------------------|
| No request or "continue" | → Level 1 |
| Vague request ("make it better") | → Level 2 |
| Moderate direction ("make this more concise") | → Level 3 |
| Specific with constraints ("shorten to 2 sentences, keep the metaphor") | → Level 4-5 |

### Dimension 3: Editing Depth

| Evidence | Score contribution |
|----------|-------------------|
| No edits | → Level 1 |
| Cosmetic edits (word swaps, punctuation) | → Level 2 |
| Minor structural edits (rephrase a clause) | → Level 3 |
| Meaningful edits (restructure, change argument) | → Level 4 |
| Substantial rewrite or original composition | → Level 5 |

### Dimension 4: Temporal Patterns

| Evidence | Score contribution |
|----------|-------------------|
| Near-zero dwell time, instant actions | → Level 1 |
| Brief pause, quick decisions | → Level 2 |
| Moderate dwell time, some back-and-forth | → Level 3 |
| Extended engagement, revisiting, deliberate pace | → Level 4-5 |

### Synthesis Rule

The LLM considers all four dimensions holistically. The final level is **not an average** -- it reflects the overall character of the user's engagement in that round.

- If any dimension is Level 5, the round is at least Level 4
- If all dimensions are Level 1, the round is Level 1
- If dimensions are mixed (e.g., good marking but vague request), the LLM weighs the most informative signals

---

## LLM Prompt Template

The following prompt is sent to GPT-4o for assessment:

```
You are evaluating a user's engagement in a round of human-AI co-writing.

CONTEXT:
- Writing goal: {goal}
- Round number: {round_number}
- Full interaction history up to this round: {interaction_log}

THIS ROUND'S EVENTS:
{round_events}

RUBRIC:
Level 5 (Writer-Driven): User typed from scratch or substantially rewrote AI text. Specific, constrained requests. Deliberate engagement with pushback. Edits changed meaning/direction.
Level 4 (Actively Shaped): Multiple deliberate marks (preserve/delete/edit mix). Directed requests. Thoughtful pushback response. Beyond-surface editing.
Level 3 (Selectively Engaged): Some marks and minor edits. Moderately specific requests. Paused to read before marking. Quick but present pushback engagement.
Level 2 (Superficially Engaged): Brief dwell time. Surface-level marks (word swaps). Vague requests. Instant pushback dismissal. No meaning changes.
Level 1 (Minimal Engagement): Near-zero dwell time. No or negligible marks. No edits. Absent or empty requests. Accepted AI output without reading.

ASSESSMENT DIMENSIONS:
1. Marking Behavior: What marks did the user make? What granularity? How selective?
2. Request Quality: How specific were the user's AI requests? Did they reference the goal?
3. Editing Depth: Did edits change meaning, or only surface form?
4. Temporal Patterns: How long did the user spend? Did they revisit? Was the pace deliberate?

RESPOND WITH:
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

---

## How Levels Map to the UI

### Reliance Indicator (always-on bar)

The session-level score is the **weighted average of all round scores**, with more recent rounds weighted slightly higher (recency bias -- current engagement matters more than early engagement).

```
  Session score = Σ (round_score × recency_weight) / Σ recency_weight

  recency_weight for round i = 1 + (i / total_rounds) × 0.5
```

Displayed as percentage: `(session_score / 5) × 100`

### Awareness Overlay (on-demand)

Each paragraph's color reflects the **most recent round that touched it**:

| Level | Color | Meaning |
|-------|-------|---------|
| 5 | Deep warm (dark orange) | Writer-driven |
| 4 | Warm (orange) | Actively shaped |
| 3 | Neutral (yellow) | Selectively engaged |
| 2 | Cool (light blue) | Superficially engaged |
| 1 | Deep cool (gray) | Minimal engagement |

---

## Open Questions

- [ ] Should the LLM assessment run after every round (potentially slow/expensive) or batch at key moments (e.g., when overlay is toggled)?
- [ ] How to handle the first round (limited history for temporal pattern assessment)?
- [ ] Should the user be able to see dimension-level scores or only the overall level?
- [ ] How to validate the LLM's assessment accuracy? (Study interview: ask users if they agree with the score)
