# CoWriThink: Supporting Appropriate Reliance in AI-Assisted Writing through Awareness and Intent Negotiation

## 1. Problem

Users lose their sense of agency and fall into overreliance or underreliance in AI-assisted writing. The root cause is a lack of **awareness** (users cannot assess their reliance) and **control** (users cannot convey their intent), mapping onto Norman's gulf of evaluation and gulf of execution.

```
Current:   AI generates  →  User accepts/rejects                        (reactive, coarse, one-shot)
Proposed:  User marks  ⇄  System negotiates  →  AI generates  ⇄  User re-marks   (continuous loop)
```

## 2. Design Requirements

### Awareness (Gulf of Evaluation)

**DR1: Reliance and quality awareness** (from R1)
Users cannot monitor their own reliance level across a session. A key cause of overreliance is that users lack criteria for distinguishing good writing from bad -- so they accept AI output uncritically. The system should address both:

- **Reliance monitoring**: visualize the degree of user vs. AI contribution across the session (quantitative). Primary signal: explicit marking actions from Process 1 (what the user preserved, deleted, negotiated). Secondary signal: passive behavioral patterns (pause duration, editing behavior) to detect segments where the user accepted AI output without genuine engagement.
- **Quality awareness**: help users evaluate whether AI contributions are actually good, not just how much they relied (qualitative).
- **Interpretability**: provide the basis for judging reliance and quality levels -- the system should explain *why* it assesses reliance or quality at a given level, not just show a number.
- **Selective focus**: users should be able to choose where to look more closely and where to look less closely, rather than being forced to review everything.
- **Provenance**: show who contributed what (user-written, AI-generated, negotiated) in a lightweight way. Tracking editing history is like excavating layered fossils -- valuable for users who want to trace where ideas and expressions originated, especially in professional writing, but it must not be burdensome. The design challenge is making provenance accessible without requiring exhaustive review.

### Control (Gulf of Execution)

**DR2: Collaborative AI behavior** (from R2)
Existing systems model users as supervisors whose requests must always be fulfilled. The AI should be able to push back, redirect, or propose alternatives -- supporting novice writers through examples, Socratic questions, and saying no when appropriate.

**DR3: Reflective space** (from R3)
Existing systems are not concerned with helping users develop the mental model for autonomous writing. Novice writers follow a knowledge-telling model, whereas experts use writing as a knowledge-transforming process (Bereiter & Scardamalia). We can compose a paragraph by supplying several words, but it is through forging connections between words and trimming sentences that thinking actually happens. Expert writers refine AI suggestions before incorporating them -- they do not accept output wholesale.

The system should leave room for thinking rather than filling every gap with AI output. Concrete design strategies include: deliberately **not intervening** in certain moments, **encouraging users not to use the system** when self-directed effort would be more productive, and **leaving a void for thinking** rather than always providing an answer.

**DR4: Fine-grained intent specification** (from R4)
Current interfaces lack UI components for conveying fine-grained intent. The AI writes over the user's text with output commonly misaligned with intent, and there is no easy way to specify goals at a granular level.

**DR5: Low-effort intent conveyance** (from R5)
Users should be able to convey intent by clicking and choosing rather than articulating from scratch.

## 3. Core Technique: Intent Anchoring

The system operates through two **separate processes** that address different aspects of control.

### Process 1: Phrase-Level Marking with Guarded Compliance

After AI generation, users review the output and mark phrases with three actions: **preserve** (keep as-is), **delete** (remove; AI regenerates), or **edit** (rewrite in-place). Each phrase/segment gets an inline action bar for low-effort selection. This operates as a continuous loop -- not a one-shot step. After the AI regenerates, the user reviews and re-marks, and the negotiation continues. Editing in-place (rather than delegating rephrasing to the AI) reinforces DR3: the user engages in a knowledge-transforming act.

However, the system does not blindly comply. It evaluates marks against the user's existing goals and the text's overall coherence. If a mark is **inconsistent** -- e.g., deleting a phrase that is structurally essential, or preserving something that contradicts the stated direction -- the system can **refuse and explain why**, or **suggest an alternative** that better achieves the goal.

This is negotiation at the low level: the user says what they want to keep or discard, and the system pushes back when it has reason to.

### Process 2: Proactive Objective Surfacing

Separately from phrase-level marking, the system **proactively surfaces high-level writing objectives** when it detects misalignment or ambiguity. This is not inferred from the user's marks -- it is the system's own initiative.

When the system's understanding of the writing direction diverges from what the user appears to be doing, or when clarification is needed, the system presents options: alternative directions, potential goals the user may not have considered, or questions that expose unresolved ambiguity. The user selects or adjusts rather than articulating from scratch.

This addresses the core problem with prompt-based control: users often cannot express high-level objectives because those objectives are unclear even to themselves. Instead of requiring users to formulate goals upfront, the system proposes candidates and lets the user react.

### How the Two Processes Relate

These are **separate but complementary**:

| | Process 1: Phrase Marking | Process 2: Objective Surfacing |
|---|---|---|
| **Initiated by** | User | System |
| **Operates on** | Specific phrases in the text | Overall writing direction |
| **Granularity** | Low-level (preserve/delete/edit) | High-level (goals, direction, purpose) |
| **Negotiation** | System refuses or suggests alternatives when marks conflict with goals | System proactively proposes when it detects misalignment or ambiguity |
| **Addresses** | DR4 (fine-grained control) | DR5 (low-effort intent conveyance), DR2 (collaborative behavior) |

Together, they give the user fine-grained control over the text (Process 1) while ensuring the broader direction stays coherent and the user's emerging intent is made explicit (Process 2).

### Why It Is Novel

No existing system combines these two processes:

- Track changes (Word): phrase-level marking exists, but no goal-aware refusal or objective surfacing
- Grammarly: system-initiated suggestions exist, but only at the surface level (grammar, tone), not writing objectives
- Prompt-based control: requires upfront articulation of goals, which is the exact problem when goals are unclear
- Accept/reject interfaces: binary response to AI output, no user-initiated constraints or system-initiated negotiation

Intent Anchoring is **phrase-level with guarded compliance** (Process 1) and **proactively objective-surfacing** (Process 2).

### Coverage Across Design Requirements

| DR | How It Is Addressed |
|----|---------------------|
| DR1 | Cumulative marking and negotiation records feed reliance monitoring; post-generation re-marking is where provenance becomes visible (user-written, AI-generated, negotiated); the continuous loop provides interpretable, lightweight awareness without requiring exhaustive history review |
| DR2 | System refuses inappropriate marks (P1) and proactively proposes directions (P2) -- genuine collaboration |
| DR3 | Marking forces reflection on what matters; objective surfacing helps users articulate emerging intent without replacing their thinking |
| DR4 | Phrase-level preserve/delete marking (P1) |
| DR5 | Selecting from system-proposed objectives (P2) replaces articulating goals from scratch |

## 4. System Architecture

| Component | Role |
|-----------|------|
| Process 1: Phrase-level marking | User marks preserve/delete before and after generation; system negotiates via guarded compliance (primary contribution) |
| Process 2: Objective surfacing | System proactively surfaces high-level direction when it detects misalignment or ambiguity |
| Awareness layer | Reliance monitoring, quality awareness, interpretability, selective focus -- built on provenance data from Process 1 (DR1) |
| Provenance tracking | Lightweight attribution of who contributed what (user / AI / negotiated) -- data infrastructure for awareness layer and post-generation review |

## 5. Paper Structure

1. **Introduction** -- overreliance/underreliance problem; root cause as lack of awareness and control; introduce CoWriThink
2. **Related Work** -- appropriate reliance; agency and authorship in AI-assisted writing; self-regulation in writing (Bereiter & Scardamalia); fine-grained control in collaborative writing
3. **Design Requirements** -- DR1 through DR5
4. **System Design** -- intent anchoring, negotiation loop, awareness dashboard, provenance layer
5. **Evaluation** -- metrics: appropriate reliance, perceived agency, sense of authorship
6. **Discussion** -- paradigm shift from reactive to proactive; writing as a thinking tool; limitations

## 6. Key References

- Bereiter & Scardamalia -- knowledge-telling vs. knowledge-transforming
- Norman -- gulf of evaluation and gulf of execution
- Horvitz (1999) -- mixed-initiative interaction
- Schon -- reflective practice
- Zimmerman -- self-regulated learning
