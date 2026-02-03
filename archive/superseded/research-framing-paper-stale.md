# CoWriThink: Supporting Appropriate Reliance in AI-Assisted Writing through Awareness and Intent Negotiation

## 1. Motivation

Context: https://openai.com/ko-KR/prism/

Can we provide users with a better experience in AI-assisted writing while maintaining an ``appropriate reliance`` level?

### The Problem

The reasons users lose their sense of agency and fall into overreliance or underreliance -- rather than appropriate reliance -- are **multifaceted**, especially in writing. We argue that the root cause is a lack of **awareness** (users cannot assess their reliance) and **control** (users cannot convey their intent), which maps onto Norman's gulf of evaluation and gulf of execution.

### Current Paradigm vs. Proposed Paradigm

```
Current:   AI generates  →  User accepts/rejects       (reactive, coarse)
Proposed:  User marks intent  →  AI generates within constraints  (proactive, fine-grained)
```

---

## 2. Framing Rationale

### Why Not "Appropriate Reliance, Preserving Agency, and Supporting Authorship"?

Listing three separate concepts invites the criticism that the research is too coarsely targeted -- essentially three papers bundled into one. Each concept comes from a different theoretical tradition, making it difficult to argue a unified contribution.

### Reframing Strategy

Since the main contribution is a **system design**, the theoretical concepts should serve as **design rationale and evaluation metrics**, not as the contribution itself.

- **Reliance, Agency, Authorship** → demoted to **evaluation metrics** (measured in the study to validate the system)
- **Awareness + Control** → promoted to the **system's design goals** (what the system provides)
- **Intent Anchoring** → the **core interaction technique** (the novel contribution)

### Alternative Framings Considered

| Option | Framing | Pros | Cons |
|--------|---------|------|------|
| A | Writer Agency | Concise; well-established in HCI | Too broad, still vague |
| B | Self-Regulated Writing | R1-R5 map cleanly to self-regulation stages (monitoring → strategy → execution); strong theoretical backbone | Learning-oriented frame needs justification in writing context |
| C | Reflective Co-Writing | Connects to Schon's reflective practice; aligns with R3 knowledge-transforming | "Reflective" may not foreground the system contribution |
| D | Calibrated Collaboration | Directly captures the overreliance/underreliance tension | "Calibration" mostly used in trust/automation literature; needs bridging |
| **E** | **Awareness + Control (chosen)** | **Maps to Norman's gulfs; R1-R5 cleanly partition into two axes; foregrounds what the system actually provides** | **Requires a strong interaction technique to be concrete** |

Option E was chosen because system papers need to foreground what the system *does*. Awareness + Control describes the system's two functional pillars, and Intent Anchoring is the concrete technique that delivers them.

---

## 3. Research Claims → Design Requirements

### Awareness (Gulf of Evaluation)

#### R1: Users cannot monitor their own reliance level across an entire session.
- Users should be able to monitor the degree of their reliance.
- The system should provide interpretability regarding the basis for judging that degree.
- Users should be able to choose where to look more closely and where to look less closely.

**→ DR1: Reliance awareness component** -- visualize user agency/engagement across the session; nudge additional intervention when agency is low at the text level.

### Control (Gulf of Execution)

#### R2: Existing systems model the user as a supervisor rather than a collaborator.
A request is treated as something that must always be fulfilled. Most AI-assisted writing ends up as bad writing because the AI accommodates even ``bad`` requests without pushback. The system should support novice writers by: 1) providing examples, 2) posing Socratic questions, and 3) saying no or proposing a different direction. The key question is: a collaborator toward *what goal*? What purpose does the collaboration serve?

**→ DR2: Collaborative AI behavior** -- the AI can push back, redirect, or propose alternatives rather than unconditionally fulfilling requests.

#### R3: Existing systems are not concerned with helping users develop the mental model needed for autonomous writing.
This is a matter of mental model rather than ability. In cognitivism, novice writers follow a knowledge-telling model, whereas experts use writing as a ``knowledge-transforming`` process (Bereiter & Scardamalia). Writing is a means of refining thought before it is a productivity tool. From this perspective, not intervening, encouraging users not to use the system, or leaving a void for thinking is important. We can compose a paragraph by supplying several words, but it is through forging connections between words and trimming sentences that thinking actually happens. Expert writers refine AI suggestions before incorporating them.

**→ DR3: Reflective space** -- the system should leave room for the user's own thinking rather than filling every gap with AI output.

#### R4: Underreliance and overreliance stem from the difficulty of conveying user intent at a fine-grained level.
Current human-AI collaborative writing interfaces lack the UI components needed for users to convey fine-grained intent. The AI simply writes over the user's text, and its output is commonly misaligned with the user's intent -- yet there is no easy way to reflect the user's intent, goals, or objectives.

**→ DR4: Fine-grained intent specification** -- phrase-level interaction for expressing intent.

#### R5: Underreliance and overreliance stem from the difficulty of conveying user intent easily.
Users can request help in repetitive processes by choosing options or clicking icons. Users can convey their intent easily by selecting among options provided by the system.

**→ DR5: Low-effort intent conveyance** -- click and choose rather than articulate.

### Limitations of Previous Research

Tracking the text editing process is more like excavating layered history (akin to digging up fossils) -- but will users actually review this history? Likely not, because it is too burdensome. However, users who want to edit the text further may want to check where each idea originated and how they or the AI agent contributed, especially when searching for the right words or phrases in professional writing.

---

## 4. Core Technique: Intent Anchoring

### What It Is

Users express their intent at the phrase level by interacting with their text directly, and the system translates those interactions into constraints for AI generation.

### Interaction Flow

1. User has text (their own or AI-generated).
2. User clicks/selects a phrase → system **predicts intent** and offers choices (e.g., "preserve this expression?", "rephrase this?", "expand this idea?", "delete?").
3. User **chooses** from predicted intents (low effort, fine-grained).
4. AI generates new text **respecting the anchored intents**.
5. If misaligned → user re-anchors → negotiation cycle.

### Why It Is Novel

It inverts the standard human-AI writing interaction. Instead of the AI suggesting and the user reacting, the user pre-specifies constraints and the AI generates within them. The system predicts intent so users do not need to articulate their goals from scratch -- they simply select.

Closest existing work and distinctions:
- Track changes in Word: post-hoc, not pre-generative
- Grammarly's suggestions: AI-initiated, not user-initiated
- Prompt-based control: requires explicit articulation, coarse-grained

Intent Anchoring is **user-initiated, phrase-level, prediction-assisted, and pre-generative** -- a combination that does not exist in current systems.

### How It Addresses All Research Claims

| Claim | How Intent Anchoring Addresses It |
|-------|-----------------------------------|
| R1 (Awareness) | The cumulative record of anchoring interactions provides data for reliance awareness visualization |
| R2 (Collaborator) | The system predicts and proposes rather than blindly executing, creating a collaborative dialogue |
| R3 (Reflection) | Deciding what to preserve and what to discard forces the user to reflect on their writing -- a knowledge-transforming act |
| R4 (Fine-grained) | Phrase-level interaction provides fine-grained intent specification |
| R5 (Easy) | Click + choose instead of articulate reduces effort |

---

## 5. Candidate Techniques: Novelty Assessment

| # | Technique | Novelty | Role in System |
|---|-----------|---------|----------------|
| **3** | Click phrase → system predicts intent → user chooses (Intent Anchoring) | **A** (new interaction paradigm) | **Primary contribution** |
| 4 | System and user negotiate direction and expression (adjusted proactiveness) | B+ (mixed-initiative variant) | Interaction loop wrapping #3 |
| 1 | Agency/engagement visualization with nudging | B (known patterns, novel application) | Awareness layer using #3 data |
| 2 | Track text provenance (user vs. AI contributions) | C (well-explored: DocuViz CHI'13 et al.) | Data infrastructure supporting #3 |

### System Architecture

```
#3 (Intent Anchoring)     →  Core interaction technique (primary contribution)
#4 (Negotiation)          →  Interaction loop wrapping #3
#1 (Agency visualization) →  Awareness layer built on #3 data
#2 (Provenance tracking)  →  Data infrastructure enabling #1 and #3
```

---

## 6. Proposed Paper Structure

```
1. Introduction
   - AI writing tools cause overreliance/underreliance
   - Root cause: lack of awareness and control (Norman's two gulfs)
   - We present CoWriThink, an intent-anchoring interface for human-AI co-writing

2. Related Work
   - Appropriate reliance in human-AI interaction
   - Agency and authorship in AI-assisted writing
   - Self-regulation in writing (Bereiter & Scardamalia)
   - Fine-grained control in collaborative writing interfaces

3. Design Requirements
   - DR1: Reliance awareness (from R1)
   - DR2: Collaborative AI behavior (from R2)
   - DR3: Reflective space (from R3)
   - DR4: Fine-grained intent specification (from R4)
   - DR5: Low-effort intent conveyance (from R5)

4. System Design: CoWriThink
   - Intent Anchoring: the core interaction technique
   - Negotiation loop: adjusted proactiveness
   - Awareness dashboard: agency visualization
   - Provenance layer: tracking contributions

5. Evaluation
   - Metrics: appropriate reliance, perceived agency, sense of authorship
   - Study design: [TBD]

6. Discussion
   - How intent anchoring shifts the human-AI writing paradigm
   - Implications for writing as a thinking tool
   - Limitations and future work
```

---

## 7. Key References

- Bereiter & Scardamalia -- knowledge-telling vs. knowledge-transforming models of writing
- Norman -- gulf of evaluation and gulf of execution
- Horvitz (1999) -- mixed-initiative interaction
- Schon -- reflective practice
- Zimmerman -- self-regulated learning (supporting theoretical frame)
