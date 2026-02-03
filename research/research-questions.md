# Elaborating Questions for Research Direction

## Over/Under Reliance in Human-AI Co-Writing

Use these questions to refine your research scope and identify key tensions.

---

## 1. Scope & Framing

- [ ] **Which factor is primary?** Are these factors (monitoring, mental model, intent communication) equally weighted, or does one underlie the others?

- [ ] **What's the relationship between R4 and R5?** Is fine-grained control fundamentally at odds with ease of use? Can we have both?

- [ ] **Is "appropriate reliance" a stable target?** Should it vary by task type (brainstorming vs. polishing vs. professional writing)?

- [ ] **What distinguishes writing from other AI-assisted tasks?** Why does reliance matter more (or differently) here?

---

## 2. Self-Monitoring (R1)

- [ ] **What granularity of monitoring helps?** Word-level? Paragraph-level? Session-level? Idea-level?

- [ ] **When do users actually want to review contribution history?** What triggers that need? (editing intent? ownership concern? quality doubt?)

- [ ] **Does awareness of reliance change behavior?** Or do users just feel guilty without acting differently?

- [ ] **How do we balance transparency with cognitive burden?** The "fossil excavation" metaphor suggests history is valuable but heavy.

- [ ] **What makes interpretability actionable?** Knowing "AI wrote 60% of this" — then what?

---

## 3. Agency & Mental Model (R2, R3)

- [ ] **Can AI "say no" without frustrating users?** What framing makes pushback acceptable? (Socratic questioning? alternatives? explanation?)

- [ ] **How do we detect when a user needs "void for thinking" vs. genuine assistance?** Are there behavioral signals?

- [ ] **Can we scaffold the knowledge-telling → knowledge-transforming transition?** Or is that beyond tool design — a pedagogical problem?

- [ ] **What do expert writers do differently with AI suggestions?** How do they "refine" rather than "accept"?

- [ ] **Should the system adapt its intervention level based on user expertise?** How do we assess expertise?

- [ ] **Is there a risk that AI assistance prevents users from developing writing expertise?** How do we measure this?

---

## 4. Intent Communication (R4, R5)

- [ ] **What are the most common misalignments?** Tone? Structure? Depth? Word choice? Voice? Argument direction?

- [ ] **What UI primitives are missing?** Sliders? Constraints? Examples? Comparison views? Inline annotations?

- [ ] **Is the problem input (expressing intent) or output (interpreting AI response)?** Or both?

- [ ] **How much specification is too much?** When does conveying intent become more work than just writing?

- [ ] **Can intent be inferred from context rather than explicitly stated?** What signals could the system use?

---

## 5. Design Trade-offs

- [ ] **Who is the target user?** Novice writers need different support than experts. Can one system serve both?

- [ ] **Is Prism the right testbed?** Does its specific interaction model constrain or enable your design explorations?

- [ ] **What's the evaluation metric for "appropriate reliance"?**
  - Writing quality (by whose judgment?)
  - User satisfaction
  - Learning outcomes
  - Sense of ownership/authorship
  - Cognitive engagement during writing

- [ ] **What's the minimal intervention that shifts reliance patterns?** Do we need a full system redesign, or can small nudges work?

---

## 6. Your Contribution

- [ ] **Which R (R1-R5) will you focus on?** Or will you address the interaction between multiple factors?

- [ ] **What's the novel claim?** What hasn't been said in prior work on AI-assisted writing?

- [ ] **What artifact will you build?** A new interface? A measurement tool? A design framework?

- [ ] **What study design will validate your claims?** Lab study? Longitudinal deployment? Think-aloud protocol?

---

## Your Answers (Captured from Q&A Session)

### Scope Decisions
- **Primary factor:** All factors are interconnected — this is a complex, multi-causal problem
- **Core mechanism:** No single mechanism; all links (awareness, system model, communication, expertise) contribute
- **Research focus:** Intervention design + system building
- **Writing context:** Prism-like interface

### System Design Decisions
- **System type:** Hybrid — combining multiple intervention types
- **Target user:** All expertise levels
- **Priority prototype:** Reliance visualization + Fine-grained intent controls
- **All planned components:**
  1. Reliance visualization
  2. AI pushback / Socratic mode
  3. Fine-grained intent controls
  4. Thinking pause / void mode

### Visualization Design
- **Approach:** Adaptive, combining:
  - Color-coded text overlay (AI vs human inline)
  - Session-level dashboard (reliance ratio over time)
  - Idea-level attribution (origin tracking beyond words)

### Intent Control Design (Refined)

**Three interaction mechanisms:**

1. **Diff-style keep/discard** (inspired by Cursor)
   - Red/green highlighted text after AI generation
   - User selects which parts to keep vs discard
   - Granularity: Adaptive — system learns from user acceptance/rejection patterns
   - Drafting → coarser units, polishing → finer units

2. **DeepL-style alternative exploration**
   - Click-to-swap alternatives at varying granularity
   - Mixed by context: word-level for polishing, paragraph-level for drafting
   - Lets users explore options without explicit prompting

3. **Adaptive intent clarification questions**
   - System asks MCQs to clarify user intent
   - Timing: Primarily before generating, but adaptively triggered
   - System learns when questions are helpful vs. disruptive

**Adaptation signal:** User behavior — track acceptance/rejection patterns to learn preferred granularity

**Relation to visualization:** Layered toggle — same text view, user switches between reliance view and edit view

### Research Strategy
- **Novel contribution:** Design insights for next-gen co-writing tools (Prism-style)
- **Study design:** Longitudinal deployment
- **Biggest risk:** Scope too broad
- **Venue plan:** Workshop/WIP first, then CHI or CSCW
- **Evaluation:** Multiple metrics (writing quality + ownership + reliance balance)

---

## Related Work Positioning

### Key Distinction from DraftMarks
- DraftMarks: **reader-facing** transparency (post-hoc, skeuomorphic traces for readers)
- Ours: **writer-facing** self-regulation (real-time, during writing, for the writer themselves)

### Three-Part Gap Argument
1. **Observe vs. intervene** — Prior work measures reliance but doesn't actively change it
2. **Single-cause vs. multi-cause** — Prior work isolates one factor; we address interacting factors
3. **Passive vs. adaptive** — Prior tools are static; ours learns from user behavior patterns

### Related Work Survey Needed

| Area | Key Papers to Find | Why It Matters |
|------|-------------------|----------------|
| Appropriate reliance in XAI | Bansal et al., Bucinca et al. | Theoretical grounding for reliance calibration |
| Writing cognition theory | Bereiter & Scardamalia, Flower & Hayes | Knowledge-telling vs knowledge-transforming model |
| Controllable generation UI | DeepL, Grammarly, writingmate interfaces | Design precedents for intent controls |

### Study Design
- **Baselines:** TBD — need to decide between Prism-only vs. ablation conditions vs. full comparison

---

## Open Questions to Resolve Next

- [ ] How to scope down from 4 components to a manageable prototype?
- [ ] What specific Prism interaction patterns will you extend or redesign?
- [ ] How to define and operationalize "appropriate reliance" as a measurable construct?
- [ ] What is the longitudinal deployment duration and participant count?
- [ ] What study conditions to compare? (Prism-only vs. ablation vs. full system)
- [ ] How to bridge XAI reliance literature with writing-specific context?
