# Deep-writer: Visualizing Cognitive Engagement in AI-Assisted Writing

**Project Proposal (Draft)**

---

## Problem

AI writing assistants (ChatGPT, Copilot, etc.) have transformed how people write. However, a critical question emerges: **"Is this still my writing?"**

Current tools treat authorship as binary—either human-written or AI-generated. But this framing misses the essential point. A user who carefully evaluates, selects, and integrates AI suggestions is fundamentally more cognitively engaged than one who blindly accepts them—even when the final text appears identical.

This creates a core tension: **Writing has long been recognized as a "tool for thought"** (Vygotsky, 1978; Flower & Hayes, 1981)—a cognitive process that shapes thinking, not merely records it. When AI automates parts of this process, we risk losing the cognitive benefits that writing provides.

This manifests in two interconnected problems:

1. **For individuals**: Loss of ownership, skill atrophy ("deskilling"), reduced learning, and inefficient allocation of limited cognitive resources
2. **For educators/researchers**: No methodology to assess the *process* of human-AI collaboration—only the *product*

---

## Solution: deep-writer

We propose **deep-writer**, a writing environment that visualizes **cognitive engagement** in real-time using a continuous gradient spectrum—moving beyond binary human/AI attribution.

### Key Innovation: Cognitive Resource Allocation Interface

The core insight is not simply that users should "review more." Rather, **deep-writer enables strategic allocation of limited cognitive resources**. By making engagement visible, users can:

- Identify segments where they were cognitively disengaged
- Selectively focus attention on those specific areas
- Make the overall writing process more *efficient*, not just more thorough

**Engagement ≠ Authorship.** We measure *how consciously* a user engaged with each part of their text:

| Behavior | Engagement |
|----------|------------|
| Typed from scratch with planning pauses | High (90-100%) |
| AI suggestion accepted after deliberate review | Medium (50-70%) |
| AI suggestion accepted instantly without review | Low (20-30%) |

This is visualized as **background color gradients** on the text itself—darker = higher engagement.

### Design Principle: A Common Interface for Writers, Learners, and Educators

Writing is a universal tool for thought. Therefore, deep-writer is designed as a **common interface** that serves multiple stakeholders:

- **Writers**: Monitor their own cognitive engagement during the writing process
- **Learners**: Maintain and develop writing skills while using AI assistance
- **Educators**: Understand and assess students' writing *process*, not just products

Critically, the engagement visualization is available **on-demand**—users activate it when they want insight, rather than being constantly monitored. This preserves the sense of agency and avoids surveillance fatigue.

### Core Features

1. **Gradient Visualization**: Each text segment shows engagement level via background color
2. **Cursor-style Diff Review**: AI changes appear as green/red diff; user accepts/declines (partial accept supported)
3. **Real-time Pause Inquiry (ESM)**: Contextual popup collects ground truth on what users were doing during pauses
4. **On-demand Review Mode**: Users can toggle engagement view when desired
5. **Skill Tracking (Phase 2)**: Decomposes engagement into specific cognitive sub-skills (planning, evaluation, revision, integration, etc.)

---

## Research Contributions

| Existing Approach | Our Contribution |
|-------------------|------------------|
| Binary attribution (human vs AI) | **Continuous engagement gradient** |
| Post-hoc analysis of final text | **Real-time process visualization** |
| Passive measurement | **Actionable feedback** (nudges user to review) |
| Single ownership metric | **Multi-dimensional skill tracking** |

### Key Research Questions

1. **Resource Allocation**: Does engagement visualization enable more efficient allocation of cognitive resources? (i.e., users focus attention strategically rather than uniformly)
2. **Outcome Quality**: Does strategic engagement lead to better writing quality, deeper learning, or higher satisfaction?
3. **Model Validity**: Can behavioral signals (keystrokes, pauses, cursor patterns) accurately predict cognitive engagement without eye-tracking?
4. **Deskilling Prevention**: Can skill-level visualization help users maintain and develop writing abilities while leveraging AI assistance?
5. **Common Interface Efficacy**: Does the same interface serve diverse stakeholders (writers, learners, educators) effectively?

---

## Technical Approach

**Engagement Inference** (without eye-tracking):
- Mouse cursor patterns + behavioral ceilings (passive viewing has max limit)
- Pause analysis: context-dependent interpretation (writing pause ≠ diff-viewing pause)
- Post-pause burst analysis: productive pauses lead to substantial output
- Experience Sampling: real-time popup for ground truth validation

**Design Principle**: `Looking < Thinking < Doing`
- Passive behaviors (viewing) have engagement ceiling
- Active behaviors (editing, declining, rewriting) can reach 100%

---

## Target Users: A Common Interface

deep-writer is designed as a **unified interface** serving the writing ecosystem:

| Stakeholder | Need | How deep-writer Helps |
|-------------|------|----------------------|
| **Writers** | "I want to stay cognitively engaged while using AI efficiently" | On-demand engagement view for strategic resource allocation |
| **Learners** | "I want to develop my skills, not just produce text" | Skill tracking, deskilling alerts, deliberate practice support |
| **Educators** | "I need to understand and assess the writing *process*" | Process analytics, engagement reports, coaching insights |
| **Researchers** | "I need rich data on human-AI collaboration dynamics" | Behavioral logs, ground truth collection via ESM |

**Key design decision**: The same interface serves all stakeholders with role-appropriate views, rather than separate tools for each.

---

## Development Phases

| Phase | Focus | Timeline |
|-------|-------|----------|
| **Phase 1 (MVP)** | Engagement gradient, diff review, pause analysis | TBD |
| **Phase 2** | Skill taxonomy, accumulation tracking, deskilling alerts | After MVP |

---

## Broader Impact & Significance

### Theoretical Contribution

This work extends the classical "writing as a tool for thought" framework (Flower & Hayes, 1981) into the AI era. We argue that **the cognitive benefits of writing should be preserved even when AI assists the production process**. deep-writer operationalizes this by making cognitive engagement visible and actionable.

### Design Contribution

We introduce a new design paradigm: **Cognitive Resource Allocation Interfaces**. Unlike productivity-focused AI tools that optimize for output, deep-writer optimizes for *strategic attention allocation*—helping users engage efficiently rather than exhaustively.

### Methodological Contribution

We demonstrate that cognitive engagement can be inferred from lightweight behavioral signals (keystrokes, cursor movements, pauses) without requiring eye-tracking, enabling scalable deployment and research.

### Practical Impact

As AI writing tools become ubiquitous, there is urgent need for interfaces that:
- **Preserve human agency** rather than merely boosting productivity
- **Make invisible cognitive work visible** so users can reclaim ownership
- **Support skill development** rather than encouraging passive delegation

deep-writer transforms the opaque process of human-AI collaboration into a transparent, actionable experience—benefiting writers, learners, and educators alike.

---

## Collaboration Opportunities

We are seeking collaborators with expertise in:

- **Human-AI Interaction**: Design and evaluation of AI-assisted creative tools
- **Writing Research**: Cognitive writing processes, composition studies
- **Learning Sciences**: Educational technology, learning analytics, skill development
- **NLP/AI Systems**: Language models, intelligent tutoring systems

We welcome discussion on potential collaboration, study design, and theoretical framing.

---

## References (Selected)

- Flower, L., & Hayes, J. R. (1981). A cognitive process theory of writing. *College Composition and Communication*, 32(4), 365-387.
- Vygotsky, L. S. (1978). *Mind in society: The development of higher psychological processes*. Harvard University Press.
- [Additional references on human-AI collaboration, authorship, cognitive engagement to be added]

---

*This is a draft proposal for discussion. Feedback and suggestions are welcome.*
