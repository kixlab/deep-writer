# Evaluation Plan

Workshop paper evaluation: qualitative design exploration.

---

## Study Overview

| Aspect | Detail |
|--------|--------|
| **Goal** | Understand how users interact with CoWriThink and which components are useful, confusing, or unnecessary |
| **Method** | Think-aloud protocol + semi-structured interview |
| **Participants** | 5-8, mixed expertise spectrum |
| **Tasks** | Two tasks per participant: write from scratch + revise existing draft |
| **Data** | Think-aloud transcripts, interview transcripts, behavioral logs, screen recordings |

---

## Participants

**Recruitment target:** 5-8 participants across the writing expertise spectrum.

| Level | Example profile | Target count |
|-------|----------------|--------------|
| Novice | Undergraduate student, limited formal writing experience | 2 |
| Intermediate | Graduate student, writes regularly for coursework/research | 2 |
| Advanced | Postdoc or early-career researcher, publishes papers | 1-2 |
| Expert | Senior researcher or professional writer | 1-2 |

**Screening criteria:**
- Must have used at least one AI writing tool before (ChatGPT, Copilot, Grammarly, etc.)
- Must be comfortable writing in English
- No prior exposure to CoWriThink

**Recruitment source:** (TBD -- university mailing lists, lab networks, etc.)

---

## Study Protocol

### Session structure (per participant)

**Total duration:** ~60-75 minutes

```
1. Introduction & consent              (5 min)
2. System tutorial                     (10 min)
3. Task 1: Write from scratch          (15 min)
4. Brief reflection                    (5 min)
5. Task 2: Revise existing draft       (15 min)
6. Semi-structured interview           (15-20 min)
7. Debrief                             (5 min)
```

### Task 1: Write from scratch

Participants write a short argumentative essay (~300-500 words) on a provided topic using CoWriThink. They start with the goal prompt and can choose either blank editor or AI first draft.

**Suggested topic:** "Should universities adopt AI-powered grading systems?"
- Accessible to all expertise levels
- Has clear for/against positions (tests Process 2 misalignment detection)
- No domain expertise required

**Think-aloud instruction:** "Please think out loud as you work. Tell me what you're looking at, what you're deciding, and why."

### Task 2: Revise existing draft

Participants receive a pre-written draft (~400 words) with deliberate weaknesses:
- Some cliched phrasing (tests quality pushback)
- One paragraph that contradicts the thesis (tests structural pushback)
- Generally acceptable but improvable text

Participants revise the draft using CoWriThink's AI assistance.

**Why a provided draft (not their own):** Controls for content familiarity. All participants revise the same text, making comparison possible.

### Semi-structured interview

Three themes, roughly 5-7 minutes each:

**Theme 1: Component feedback**
- "Walk me through how you used the marking feature. Was anything confusing?"
- "Did the system push back on any of your decisions? How did that feel?"
- "Did you notice the notification bar suggesting directions? What did you think?"
- "Did you check the reliance indicator? Why or why not?"

**Theme 2: Ownership and agency**
- "Looking at your final text, how much of it feels like yours?"
- "Was there a moment when you felt especially in control? Or not in control?"
- "How does this compare to your experience with [their usual AI writing tool]?"
- "If you had to put your name on this essay, how comfortable would you be?"

**Theme 3: Behavioral self-awareness**
- "Did this system change how you thought about your own writing process?"
- "Were you aware of how much you were relying on AI? Did that awareness affect what you did?"
- "Was there a moment when the system made you reconsider a decision?"
- "Would you use this system differently in a second session?"

---

## Data Collection

### Behavioral logs (automatic)

| Log | What it captures | Analysis purpose |
|-----|-----------------|-----------------|
| Marking events | Every preserve/delete/edit action with timestamp | Interaction patterns, engagement over time |
| Granularity usage | Word vs. phrase vs. sentence level selections | How users naturally segment text |
| Pushback events | Every guarded compliance trigger + user response (override or accept) | Pushback acceptance rate, perceived usefulness |
| Process 2 events | Every notification + user response | Misalignment detection accuracy |
| Awareness toggles | When user opens/closes the reliance overlay | When and why users check reliance |
| Edit history | Full provenance log of text changes | Authorship attribution data |

### Screen recordings

Record the full session to capture interactions not logged (e.g., hesitation, mouse hovering, re-reading).

### Think-aloud transcripts

Transcribed and coded for:
- Decision points (what triggered a mark, edit, or acceptance)
- Confusion points (where the user didn't understand the system)
- Emotional responses (frustration, satisfaction, surprise)

### Interview transcripts

Transcribed and thematically analyzed.

---

## Analysis Approach

### Qualitative analysis

**Method:** Thematic analysis (Braun & Clarke, 2006)

**Coding process:**
1. Familiarization with data (read all transcripts)
2. Generate initial codes from think-aloud and interview data
3. Group codes into themes aligned with research questions
4. Review themes against the full dataset
5. Define and name final themes

**Expected theme categories:**
- Marking behavior patterns (how users engage with Process 1)
- Pushback perception (helpful vs. intrusive)
- Directional guidance perception (Process 2 value)
- Reliance awareness effects (does awareness change behavior?)
- Ownership and authorship feelings
- Expertise-dependent differences

### Behavioral log analysis

Descriptive statistics (not inferential -- sample too small):
- Average marks per paragraph by expertise level
- Pushback override rate
- Awareness toggle frequency and timing
- Distribution of preserve / delete / edit actions

These complement the qualitative findings with behavioral evidence.

---

## Measures (Post-task Questionnaire)

Administered after each task (before the interview).

### Likert scales (7-point)

**Process 1 (Marking):**
- "The marking feature gave me control over the AI-generated text."
- "I could express what I wanted at the right level of detail."

**Guarded compliance:**
- "When the system disagreed with my choices, its reasoning was understandable."
- "The system's pushback helped me make better writing decisions."

**Process 2 (Objective surfacing):**
- "The system's suggestions about writing direction were relevant."
- "I felt the system understood what I was trying to write."

**Awareness layer:**
- "The reliance indicator helped me understand my writing process."
- "Seeing my reliance level changed how I interacted with the AI."

**Ownership:**
- "The final text feels like my own writing."
- "I feel comfortable putting my name on this text."

**Overall:**
- "This system gave me a better sense of control compared to other AI writing tools."
- "I would use this system for my own writing."

### Open-ended
- "What was the most useful feature? Why?"
- "What was the most frustrating moment? Why?"
- "What would you change about this system?"

---

## Expected Outcomes

### For the workshop paper

The study should produce:

1. **Interaction patterns** -- how different expertise levels use the marking system
2. **Component-level insights** -- which components (Process 1, pushback, Process 2, awareness) are perceived as valuable vs. unnecessary
3. **Design tensions** -- trade-offs revealed (e.g., pushback frequency vs. user trust, awareness utility vs. anxiety)
4. **Expertise-dependent findings** -- how the system serves novices vs. experts differently
5. **Design implications** -- recommendations for future AI writing tools

### For the full paper (future)

The workshop findings will inform:
- Which components to include in a full ablation study
- What metrics matter most (from questionnaire and interview data)
- Revised design based on participant feedback
- Refined hypotheses for a controlled experiment

---

## Practical Considerations

- [ ] IRB approval needed
- [ ] Prototype fidelity: Functional prototype (decided)
- [ ] Compensation: gift cards or course credit
- [ ] Recording consent: screen + audio
- [ ] Task topic piloting: test the essay topic with 1-2 people first
- [ ] Draft for Task 2: needs to be written and validated

---

## Design Decisions Log

| # | Decision | Chosen |
|---|----------|--------|
| 1 | Evaluation goal | Design exploration (qualitative) |
| 2 | Study scope | 5-8 participants, think-aloud + interview |
| 3 | Participants | Mixed expertise spectrum (undergrad to faculty) |
| 4 | Tasks | Two per participant: write from scratch + revise |
| 5 | Interview focus | Component feedback + ownership/agency + behavioral self-awareness |
| 6 | Analysis | Thematic analysis + descriptive behavioral stats |
| 7 | Baseline | None for workshop paper; ablation saved for full paper |
| 8 | Prototype fidelity | Functional prototype |
