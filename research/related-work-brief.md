# Related Work Research Brief

**For:** Gemini Deep Research
**Purpose:** Find and organize related work for a CHI/CSCW workshop paper

---

## Our System in One Paragraph

We are building a writing system that helps users maintain **appropriate reliance** on AI during co-writing. The system has two pillars grounded in Norman's gulf of evaluation and gulf of execution: (1) an **awareness layer** that visualizes how much the user relies on AI across their text (color-coded authorship overlay + always-on reliance indicator), and (2) a **negotiated control** mechanism where users mark AI-generated text at word/phrase/sentence level to preserve, delete, or edit it -- and the system can **push back** (refuse or suggest alternatives) when marks conflict with the writing goal, structural coherence, or text quality. A separate process proactively surfaces high-level writing direction options when the system detects misalignment between user actions and stated goals.

---

## What We Need

A structured related work survey organized into the **5 areas** below. For each area, we need:

1. **Key papers** (full citations, venue, year) -- prioritize CHI, CSCW, UIST, IUI, DIS, EMNLP, ACL from 2019-2026
2. **What each paper does** (1-2 sentence summary)
3. **How it relates to our work** (what's similar, what's different)
4. **Gaps** -- what is NOT addressed by existing work that our system addresses

---

## Area 1: Appropriate Reliance in Human-AI Interaction

**What to search for:** Papers on calibrating user reliance on AI, overreliance, underreliance, appropriate trust, reliance calibration. Not limited to writing -- include decision-making, classification, XAI contexts.

**Key authors to look for:** Gagan Bansal, Zana Bucinca, Chenhao Tan, Vivian Lai, Ben Green

**Our position:** Most reliance work focuses on decision-making tasks (accept/reject AI recommendation). We extend this to **writing**, which is continuous, creative, and involves identity/ownership -- fundamentally different from discrete classification tasks.

**Key question for the survey:** Has anyone studied reliance calibration specifically in AI-assisted writing (not just decision-making)?

---

## Area 2: Agency and Authorship in AI-Assisted Writing

**What to search for:** Papers on user agency in AI writing tools, sense of authorship, ownership of AI-generated text, ghost-writing concerns, writer identity with AI.

**Key systems/projects to look for:** DraftMarks, Wordcraft (Google), CoAuthor, Creative Help, TaleBrush, ABScribe

**Our position:** Prior work mostly measures authorship post-hoc (surveys, interviews). We make authorship visible **in real-time** during writing through the awareness layer, and we give users fine-grained control to actively shape the text.

**Key distinction:** DraftMarks is reader-facing transparency (showing readers how AI contributed). Our system is **writer-facing self-regulation** (helping writers monitor and adjust their own reliance during the writing process).

---

## Area 3: Writing Cognition and Self-Regulation

**What to search for:** Cognitive models of writing (knowledge-telling vs. knowledge-transforming), self-regulated writing, writing as a tool for thought, metacognition in writing, deskilling concerns with AI.

**Key authors/theories:**
- Bereiter & Scardamalia -- knowledge-telling vs. knowledge-transforming
- Flower & Hayes -- cognitive process model of writing
- Zimmerman -- self-regulated learning
- Vygotsky -- writing as tool for thought

**Our position:** We argue that AI writing tools risk short-circuiting the knowledge-transforming process. Our system's guarded compliance (pushing back on uncritical acceptance) and edit-in-place (requiring users to rewrite rather than delegate rephrasing) are designed to preserve the cognitive benefits of writing.

**Key question for the survey:** Has anyone designed AI writing tools explicitly informed by writing cognition theory (Bereiter & Scardamalia, Flower & Hayes)?

---

## Area 4: Fine-Grained Control in AI-Assisted Writing

**What to search for:** Controllable text generation UI, user intent specification in writing tools, inline editing interfaces for AI text, mixed-initiative writing, negotiation in human-AI collaboration.

**Key systems to look for:** Grammarly, DeepL (click-to-swap), Cursor (diff accept/reject), Google Prism, Sudowrite, Lex, Jasper, WritingMate

**Key concepts:** Mixed-initiative interaction (Horvitz 1999), direct manipulation of AI output, prompt-based vs. direct control

**Our position:** Existing tools offer either coarse control (accept/reject entire suggestions) or require explicit prompting (articulate what you want). Our system offers **phrase-level toggle marking** (click to preserve/delete at word→phrase→sentence granularity) without requiring articulation. The system predicts high-level objectives from low-level marks rather than asking users to formulate goals.

**Key question for the survey:** What is the finest granularity of user control currently available in AI writing tools? Has anyone implemented word/phrase-level preserve/delete toggling?

---

## Area 5: AI Transparency and Provenance in Writing

**What to search for:** Text provenance tracking, contribution visualization in collaborative writing, AI attribution, transparency in AI-generated content, editing history visualization.

**Key systems to look for:** DocuViz (CHI 2013), AuthorViz, Google Docs version history, track changes paradigm

**Our position:** Provenance tracking exists but is typically post-hoc (review history after writing). Our awareness layer shows authorship attribution **in real-time** as a color overlay during the writing process, with a minimal always-on indicator. The design challenge we address: making provenance accessible without making it burdensome.

**Key question for the survey:** Has anyone integrated real-time provenance visualization directly into the writing interface (not as a separate history view)?

---

## Output Format Requested

For each area, please provide:

### Area N: [Title]

**Summary of landscape:** (2-3 sentences on the state of research)

**Key papers:**

| Paper | Venue/Year | Summary | Relation to our work |
|-------|-----------|---------|---------------------|
| Author et al. "Title" | CHI 2024 | What they did | How it compares |
| ... | ... | ... | ... |

**Gap our system addresses:** (1-2 sentences)

---

## Three-Part Gap Argument (for positioning)

Our related work should build toward this argument:

1. **Observe vs. intervene** -- Prior work measures reliance/agency but doesn't actively change it through system design
2. **Single-cause vs. multi-cause** -- Prior work isolates one factor (e.g., just transparency, or just controllability); we address awareness AND control together
3. **Passive vs. adaptive** -- Prior tools offer static interfaces; our system negotiates, pushes back, and detects misalignment

---

## Scope Notes

- **Venue priority:** CHI, CSCW, UIST, IUI, DIS for HCI; ACL, EMNLP for NLP; ToCHI, IJHCS for journals
- **Year range:** 2019-2026 preferred, seminal older works included as needed
- **Quantity:** Aim for 8-12 key papers per area, ~40-50 total
- **Exclude:** Pure NLP papers with no user study or interface component (unless foundational)
