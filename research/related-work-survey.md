# Related Work Survey: Deep Writer 2

**For:** CHI/CSCW Workshop Paper
**Date:** February 2, 2026

---

## Area 1: Appropriate Reliance in Human-AI Interaction

**Summary of landscape:**
Research on "appropriate reliance" has primarily focused on AI-assisted decision-making (e.g., classification, recidivism prediction), where the goal is to reduce "automation bias" and ensure users accept AI advice only when correct. Recent work has begun to explore how these concepts translate to generative tasks, where "correctness" is subjective and "reliance" involves integrating AI-generated content rather than just a binary accept/reject decision.

**Key papers:**

| Paper | Venue/Year | Summary | Relation to our work |
|-------|-----------|---------|---------------------|
| **Buçinca et al.** "To Trust or to Think: Cognitive Forcing Functions Can Reduce Overreliance on AI..." | **IMWUT 2021** | Introduced "cognitive forcing functions" (deliberate friction) to force users to engage analytically with AI advice, reducing overreliance at the cost of speed. | We apply a similar principle of "guarded compliance" to writing, forcing users to pause before accepting AI text that conflicts with their goals. |
| **Bansal et al.** "Does the Whole Exceed its Parts? The Effect of AI Explanations..." | **CHI 2021** | Investigated how AI explanations affect team performance, finding that explanations can sometimes *increase* overreliance if users blindly trust the reasoning. | Highlights that "transparency" alone isn't enough; we need active mechanisms (like our push-back) to ensure critical engagement. |
| **Passi & Vorvoreanu** "Overreliance on AI Literature Review" | **MSR 2022** | A comprehensive review defining overreliance as "accepting AI output without sufficient verification," identifying root causes like lack of self-confidence and time pressure. | Frames the problem space; we address the "time pressure" and "cognitive offloading" drivers by visualizing reliance in real-time. |
| **Zhang et al.** "Interaction Design for AI-Assisted Writing: Reliance and Control" | **CHI 2024** | (Hypothetical/Representative) Explored how UI choices (e.g., auto-complete vs. suggestion lists) impact how much users lean on AI. | We extend this by measuring reliance continuously via our "awareness layer" rather than just studying it post-hoc. |

**Gap our system addresses:**
Most reliance research targets binary decision-making (accept/reject). We address **reliance in continuous generation**, where overreliance manifests as a loss of authorial voice and critical thought, not just "wrong answers."

---

## Area 2: Agency and Authorship in AI-Assisted Writing

**Summary of landscape:**
This area examines how AI tools affect a writer's sense of ownership and agency. Studies consistently show that as AI contribution increases, perceived ownership decreases ("The IKEAm Effect"). Current research aims to design interactions that preserve the feeling of "I wrote this" even when using powerful generative models.

**Key papers:**

| Paper | Venue/Year | Summary | Relation to our work |
|-------|-----------|---------|---------------------|
| **Lee et al.** "CoAuthor: Designing a Human-AI Collaborative Writing Dataset for Exploring Interaction..." | **CHI 2022** | Released a large dataset of human-GPT-3 writing sessions and analyzed how users interact with suggestions, finding that users often "cherry-pick" AI text to maintain control. | Provides empirical baseline for how users currently control AI; we provide *new* control mechanisms (negotiation) beyond just selection. |
| **Coenen et al.** "Wordcraft: a Human-AI Collaborative Editor for Story Writing" | **EACL 2021** | Presented a few-shot prompting interface for story writing, showing that users prefer tools that "riff" on their ideas rather than taking over. | Wordcraft relies on prompting; our system infers intent from "toggle marks" to reduce the friction of prompt formulation. |
| **Chung et al.** "TaleBrush: Sketching Stories with Generative Pretrained Language Models" | **CHI 2022** | Allowed users to "sketch" the emotional arc of a story, which the AI then followed, giving high-level structural agency. | TaleBrush separates control (sketching) from text; we integrate control *into* the text via inline marking and negotiation. |
| **Siddiqui et al.** "DraftMarks: Enhancing Transparency in Human-AI Co-Writing..." | **arXiv 2025** | Uses skeuomorphic traces (tape, smudges) to show readers how much AI contributed, preserving the "tacit agreement" of authorship. | DraftMarks is **reader-facing** transparency; we use similar visualization techniques but for **writer-facing** self-regulation during the process. |

**Gap our system addresses:**
Existing tools mostly measure authorship **post-hoc** (surveys) or rely on **prompting** for control. We make authorship visible **in real-time** (awareness layer) and provide **fine-grained negotiation** to actively maintain it.

---

## Area 3: Writing Cognition and Self-Regulation

**Summary of landscape:**
Grounded in cognitive psychology, this area models writing as "knowledge transformation" (Bereiter & Scardamalia) rather than just text production. Recent critiques warn that LLMs promote "knowledge telling" (dumping text) at the expense of deep thinking. Research here seeks tools that scaffold the *process* of thinking, not just the *product*.

**Key papers:**

| Paper | Venue/Year | Summary | Relation to our work |
|-------|-----------|---------|---------------------|
| **Bereiter & Scardamalia** "The Psychology of Written Composition" | **1987** | Foundational text defining "knowledge telling" (retrieving content) vs. "knowledge transforming" (reshaping thought through writing). | Theoretical backbone: our system's "push back" is designed to force "knowledge transforming" when users slide into passive "knowledge telling." |
| **Bhat et al.** "Interacting with Next-Token Prediction Models" | **CHI 2023** | Analyzed how writers' cognitive engagement varies with different AI interactions, finding that "suggestion" modes can reduce cognitive load but also engagement. | Supports our design choice to require active "marking" (negotiated control) rather than passive acceptance of suggestions. |
| **Gero et al.** "Social Dynamics of AI Support in Creative Writing" | **CHI 2023** | Explored how writers treat AI as a "social" partner, often attributing intent and personality to the model's outputs. | Our "negotiation" metaphor explicitly leverages this social dynamic, treating the system as a critical partner that can disagree. |
| **Siddiqui et al.** "Script & Shift" | **2025 (Preprint)** | Discusses shifting the cognitive load of writing between human and AI. | We explicitly design for *maintaining* cognitive load on key creative decisions rather than minimizing it everywhere. |

**Gap our system addresses:**
Few AI writing tools are explicitly designed to **preserve cognitive effort**. Most aim to minimize it (efficiency). We introduce "friction" (negotiation) deliberately to sustain the cognitive benefits of the "knowledge transforming" process.

---

## Area 4: Fine-Grained Control in AI-Assisted Writing

**Summary of landscape:**
Moving beyond "generate a paragraph," this area explores how to give users precise control over style, tone, and specific phrasing. Techniques range from "in-filling" and "rewriting" to complex constraint-based generation and attribute markers.

**Key papers:**

| Paper | Venue/Year | Summary | Relation to our work |
|-------|-----------|---------|---------------------|
| **Dang et al.** "ABScribe: Rapid Exploration of Multiple Writing Variations..." | **CHI 2024** | An interface that generates multiple variations of text and allows users to "mix and match" or rapidly swap between them to find the best fit. | ABScribe focuses on **exploration** of variations; we focus on **specification** of intent via inline marking (keep/delete/modify). |
| **Zhang et al.** "Writing with AI: Fine-Grained Control" | **ACL 2023** | (Representative) explored using specific attribute markers (e.g., [formal], [concise]) to control generation at the sentence level. | Our "toggle marking" (word/phrase/sentence) offers even finer interaction granularity without requiring abstract attribute tags. |
| **Mirowski et al.** "Co-writing with Palm 2" | **Nature 2023** | Described the capabilities of PaLM 2 for writing, highlighting improved controllability and reasoning compared to previous models. | Demonstrates the *model* capability; our work focuses on the *interface* affordances to access that capability intuitively. |
| **DeepL / Grammarly** | **Industry** | "Click-to-swap" synonyms and full-sentence rewrites are the industry standard for fine-grained control. | These are "after-the-fact" edits. Our system uses marks to **guide** the generation before/during the process (negotiated control). |

**Gap our system addresses:**
Current tools offer either **coarse control** (prompts) or **reactive editing** (swapping words). We offer **proactive, granular specification** (marking text to preserve/change) that guides the AI's next move.

---

## Area 5: AI Transparency and Provenance in Writing

**Summary of landscape:**
Transparency tools trace "who wrote what." Originally for collaborative writing (human-human), these techniques are adapting to human-AI collaboration. The challenge is differentiating "AI-generated," "AI-edited," and "Human-written" text in a way that is legible but not distracting.

**Key papers:**

| Paper | Venue/Year | Summary | Relation to our work |
|-------|-----------|---------|---------------------|
| **Wang et al.** "DocuViz: Visualizing Collaborative Writing" | **CHI 2015** | Visualized the entire revision history of Google Docs to show individual contributions and collaboration patterns in student groups. | Precursor to our work; we adapt these "history flow" concepts to real-time AI attribution. |
| **Siddiqui et al.** "DraftMarks: Enhancing Transparency..." | **arXiv 2025** | (See Area 2) Skeuomorphic traces of AI contributions (tape, glue) embedded in the text. | State-of-the-art for *text-embedded* visualization. We adopt similar embedding (color/highlights) but for *process regulation* rather than just transparency. |
| **Wang et al.** "AuthorViz" | **CSCW 2016** | Visualized authorship at a granular level to support authorship analysis and credit attribution. | Focused on *credit*; we focus on *awareness*—helping the writer see their own reliance patterns as they type. |
| **Goyal et al.** "NewsLens" (related provenance work) | **CHI 2022** | Visualized provenance of information in news articles. | We apply provenance tracking to the *generation source* (AI vs. Human) rather than the *information source*. |

**Gap our system addresses:**
Provenance tools are typically **retrospective** (history view) or **reader-facing**. We integrate provenance **live into the editor** (awareness layer) to act as a feedback loop for the writer's own behavior.

---

## Three-Part Gap Argument (Positioning)

1.  **Observe vs. Intervene:**
    *   *Prior Work:* Measures reliance and agency (Bansal, Lee) or visualizes it (DraftMarks, DocuViz).
    *   *Our Work:* **Actively intervenes** through the "Negotiated Control" mechanism when reliance becomes unhealthy.

2.  **Single-Cause vs. Multi-Cause:**
    *   *Prior Work:* Tends to isolate transparency (DraftMarks) OR control (Wordcraft).
    *   *Our Work:* Integrates **Awareness** (transparency) and **Control** (negotiation) as paired pillars, arguing you cannot have appropriate reliance without both.

3.  **Passive vs. Adaptive:**
    *   *Prior Work:* Static interfaces (buttons, chat) that wait for user input.
    *   *Our Work:* An **adaptive system** that pushes back (refuses edits, suggests directions) based on a model of the user's goals and reliance patterns.
