# Summary: DraftMarks - Transparency in Human-AI Co-Writing

**Paper**: Siddiqui, M.N., Nasseri, N., Coscia, A., Pea, R., & Subramonyam, H. (2025). *DraftMarks: Enhancing Transparency in Human-AI Co-Writing Through Interactive Skeuomorphic Process Traces*. arXiv:2509.23505.

**DOI**: https://doi.org/XXXXXXX.XXXXXXX (Preprint)

**Type**: Design/System Paper

---

## Motivation & Problem

As generative AI becomes integrated into everyday writing, a fundamental problem emerges: **readers lack tools to understand how AI shaped the writing process**. The traditional "tacit agreement" between writers and readers—where text reflects the author's cognition, effort, and intent—has been disrupted.

**Key Questions**:
- Where was human effort focused?
- What role did AI play in text creation?
- How did the human-AI interaction unfold?

**Current Limitations**:
- Existing approaches (AI usage disclosures, chat logs, token-level attribution) are **external to the text**
- Readers must step out of the reading experience to consult metadata
- Abstracts away the "cognitive labor" behind the text
- Makes local interpretive decisions difficult (e.g., "Is this sentence the author's reasoning or the model's default phrasing?")

---

## Design: DraftMarks System

### Core Concept: Skeuomorphic Encodings

DraftMarks uses **familiar physical metaphors** to surface human-AI writing interactions directly within the text:

| Visual Encoding | Physical Metaphor | What It Represents |
|-----------------|-------------------|-------------------|
| **Masking Tape** | Temporary addition | AI-generated content (new text) |
| **Smudge Marks** | Motion/transformation | AI tone modifications |
| **Eraser Crumbs** | Revision effort | Prompts used to generate AI text |
| **Residual Glue** | Absence with trace | Discarded AI suggestions |
| **Ghost Text** | Faded/invisible | Prompts not included in final output |
| **Stencil Marks** | Guided tracing | AI feedback integration |
| **Font Contrast** | Handwritten vs printed | Human vs AI authorship |

### Architecture: Model-View-Controller (MVC)

```
Model (Data)          Controller              View (Display)
     │                     │                       │
Version-controlled   ┌─────┴─────┐          Skeuomorphic
Editor States        │           │          Encodings
     │               │  Trace    │               │
Text nodes with:     │Aggregator │          Masking tape
- Author (human/AI)  │     ↓     │          Eraser crumbs
- Prompt             │  Trace    │          Smudge marks
- Generated text     │Annotator  │          Ghost text
     │               │     ↓     │          Residual glue
Event-driven         │  Intent   │               │
versioning           │  Mapper   │          Stakeholder-
                     └───────────┘          specific views
```

### Stakeholder-Specific Views

The system adapts visualizations for different reader types:

| Stakeholder | Primary Need | Encoding Strategy |
|-------------|--------------|-------------------|
| **Teachers** | Formative assessment, learning process | Detailed traces, all variants |
| **Academic Reviewers** | Intellectual contribution | Minimal process info, provenance only |
| **General Readers** | Authenticity, trustworthiness | Effort markers, authenticity signals |

---

## Implementation

### Data Model

- **Version-controlled editor states** capturing complete interaction history
- **Event-driven versioning** (not time-based): new version created when:
  1. AI-authored text node inserted
  2. AI-authored text node fully removed
  3. AI-authored text node has 10+ characters deleted

### Visual Encoding Variants

**Masking Tape** (5 variants):
- Single tape: AI-generated content
- Stacked tape: Iterative AI prompting
- Scrunched tape: Human deletions within AI text
- Torn tape: Human insertions within AI text
- Segmented tape: Distinguishes AI-original vs prompt-based phrases

**Eraser Crumbs** (2 variants):
- Solid: Uniform indicator of prompt
- Density-varied: Encodes prompt complexity by shade

---

## Evaluation

### Formative Study (N=21)

**Participants**: 7 teachers, 7 academic reviewers, 7 general readers

**Key Findings**:

**Teachers**:
- Valued detailed process traces for formative assessment
- "It makes clear what the student is struggling with"
- Want visibility into micro-level writing decisions

**Academic Reviewers**:
- Viewed process visualization as "extra work"
- "I don't care about AI in the writing, I care about AI in the idea phase"
- Prefer minimal process info prioritizing intellectual contribution

**General Readers**:
- Used transparency signals to assess authenticity
- "I read articles to listen to people... extensive AI generation made them feel they weren't listening to someone's point of view"

### User Evaluation (N=70)

**Design**: Between-subjects comparing DraftMarks vs baseline (highlighted text + chat log)

**Results**:

| Metric | DraftMarks | Baseline | Improvement |
|--------|------------|----------|-------------|
| Comprehension Score | 4.29/7 | 2.86/7 | **50%** (p<0.001) |
| Q1 (tracking changes) | 51.4% | 2.9% | **+48.5pp** |
| Q2 (feedback integration) | 40.0% | 17.1% | **+22.9pp** |
| Q3 (AI contributions) | 48.6% | 11.4% | **+37.2pp** |

**Usability**:
- SUS Score: **80.5** (above 68 threshold)
- Low extraneous cognitive load (μ=3.03)
- High germane load (μ=7.42) - supports learning

---

## Key Contributions

1. **DraftMarks Visualization Technique**: Skeuomorphic design to embed writing process signals directly within AI-coauthored text

2. **MVC Tool Implementation**: Automatically generates visualizations from human-AI collaboration data

3. **Stakeholder-Specific Controller Logic**: Informed by formative study with 21 readers across 3 types

4. **Empirical Validation**: Shows DraftMarks supports more accurate interpretations than baseline disclosure

---

## Implications

### For Readers
- Enables **process-aware reading** of AI-coauthored text
- Supports local interpretive decisions during comprehension
- Reveals cognitive labor (or lack thereof) behind text

### For Writers
- **Metacognitive tool** for self-reflection
- Surfaces where effort has (or has not) been directed
- Prompts questions: "Have I done enough to make this idea my own?"

### For Educators
- Supports **formative assessment** of student-AI collaboration
- Makes visible where students struggle vs delegate to AI
- Enables tailored feedback based on collaboration patterns

### Design Tensions
- **Transparency vs authorial agency**: Writers may not want all process details exposed
- **Visibility control**: Who decides what becomes visible, to whom, and when?

---

## Limitations

1. **Does not address AI training data provenance**: Cannot expose sources that informed AI generations

2. **Skeuomorphic metaphors may lack universal legibility**: Users primarily in digital environments may not recognize physical metaphors

3. **Privacy concerns**: Writers should maintain control over what process information is shared

4. **Cultural considerations**: Physical revision artifacts may be less common in some contexts

5. **No citation layer**: Cannot determine if AI-generated text echoes protected works

---

## Key Takeaways

1. **Process transparency matters**: Surface-level AI highlighting creates "illusion of understanding" without meaningful insight
2. **Stakeholder needs differ dramatically**: One-size-fits-all transparency doesn't work
3. **Skeuomorphic design bridges physical/digital**: Familiar metaphors make abstract AI interactions interpretable
4. **In-text visualization > external metadata**: Embedded cues support close reading without breaking comprehension flow
5. **Transparency has costs**: Trade-off between interpretive transparency and authorial agency must be navigated

---

## Citation

```bibtex
@article{siddiqui2025draftmarks,
  author = {Siddiqui, Momin N. and Nasseri, Nikki and Coscia, Adam and Pea, Roy and Subramonyam, Hari},
  title = {DraftMarks: Enhancing Transparency in Human-AI Co-Writing Through Interactive Skeuomorphic Process Traces},
  journal = {arXiv preprint arXiv:2509.23505},
  year = {2025},
  note = {Under review}
}
```

---

## Related Resources

- arXiv: https://arxiv.org/abs/2509.23505
- Related work: HaLLMark [Hoque et al. 2024], CoAuthor [Lee et al. 2022], Script&Shift [Siddiqui et al. 2025]
- Design inspiration: Linkography [Goldschmidt 2014], DocuViz [Wang et al. 2015]
