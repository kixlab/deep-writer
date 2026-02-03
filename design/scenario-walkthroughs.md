# Scenario Walkthroughs

Concrete user stories that test the system design against real situations.

---

## Scenario 1: Novice Writing an Essay

**User profile:** Mina, undergraduate student. Writing a 1500-word argumentative essay on "Should AI be used in education?" for a composition class. She has ideas but struggles to organize them and often accepts AI suggestions without evaluating them.

**What this scenario tests:**
- Does the system prevent over-reliance?
- Does Process 2 (objective surfacing) help a novice clarify their argument?
- Does the awareness layer change behavior?
- Does guarded compliance support learning rather than frustrate?

---

### Step 1: Goal Setting

Mina opens CoWriThink and sets her goal:

```
┌─────────────────────────────────────────────────────────┐
│  What are you writing?                                  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ "An argumentative essay about whether AI should   │  │
│  │ be used in education. I want to argue yes but     │  │
│  │ with some concerns."                              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                                       [ Start Writing ] │
└─────────────────────────────────────────────────────────┘
```

She chooses **"Generate AI first draft"** because she doesn't know how to start.

---

### Step 2: AI Generates First Draft -- Process 1 Begins

AI produces an opening paragraph. All text appears with green diff highlight:

```
  ██ Artificial intelligence has become an integral part
  ██ of modern education, transforming how students learn
  ██ and how educators teach. While some critics argue
  ██ that AI diminishes critical thinking, the evidence
  ██ suggests that, when implemented thoughtfully, AI
  ██ tools can enhance educational outcomes significantly.
```

Mina reads it. She likes the opening but feels "the evidence suggests" is too strong -- she hasn't cited any evidence.

---

### Step 3: Mina Marks the Text

She clicks "the evidence suggests" (word-level → clicks again to expand to phrase):

```
  ██ Artificial intelligence has become an integral part
  ██ of modern education, transforming how students learn
  ██ and how educators teach. While some critics argue
  ██ that AI diminishes critical thinking,
  ░░ the evidence suggests that,                ← marked delete
  ██ when implemented thoughtfully, AI
  ██ tools can enhance educational outcomes significantly.
```

She also double-clicks "significantly" to edit it:

```
  ██ tools can enhance educational outcomes ✎ in meaningful ways.|
```

---

### Step 4: Guarded Compliance -- System Pushes Back

The system evaluates her marks. Deleting "the evidence suggests" is fine -- it's a claim she can't support yet. No pushback there.

But the system notices she **preserved the entire opening without engaging with any of it** except two small spots. Quality concern triggers:

```
  ⚠━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┊ You preserved most of this paragraph as-is.          ┊
  ┊ "integral part of modern education" is a common      ┊
  ┊ cliche. Would you like to rephrase the opening       ┊
  ┊ in your own words?                                   ┊
  ┊                                                      ┊
  ┊  [ Keep as-is ]  [ Let me rephrase ]                 ┊
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Key moment:** This is the system acting as a collaborator, not a gatekeeper. It nudges Mina to engage more deeply, supporting the knowledge-transforming process (DR3).

---

### Step 5: Mina Chooses to Rephrase

She clicks "Let me rephrase" and double-clicks the opening:

```
  ✎ AI is everywhere in schools now, but is that a good thing?|
```

She replaces a polished AI sentence with a rougher but *genuinely hers* sentence. The provenance layer records this as user-written.

---

### Step 6: AI Regenerates

```
  ██ AI is everywhere in schools now, but is that      (user-written)
  ██ a good thing?
  ██ While some critics argue that AI diminishes        (preserved)
  ██ critical thinking, when implemented thoughtfully,
  ██ AI tools can enhance educational outcomes
  ██ in meaningful ways.                                (user-edited)
```

The loop continues through subsequent paragraphs.

---

### Step 7: Process 2 Triggers -- Misalignment Detected

After three paragraphs, Mina has been accepting AI text that argues strongly *for* AI in education. But her stated goal included "with some concerns." The system detects the imbalance:

```
├─────────────────────────────────────────────────────────┤
│ ⚡ Your essay so far argues entirely in favor of AI     │
│    in education, but your goal mentioned "some          │
│    concerns." Want to adjust?                           │
│                                                         │
│  [ Add a concerns paragraph ]                           │
│  [ Adjust goal: remove the concerns angle ]             │
│  [ Dismiss ]                                            │
└─────────────────────────────────────────────────────────┘
```

Mina clicks "Add a concerns paragraph." AI generates a paragraph addressing concerns, and she marks it through Process 1.

---

### Step 8: Awareness Check

Halfway through, Mina clicks the reliance indicator:

```
  [ ■■□□□ 38% ]  ← her involvement is low
```

The text overlay reveals large blocks of gray (AI-accepted) with small islands of blue (user-written) and purple (user-edited). She realizes she's been accepting too much without engaging.

She goes back and starts marking more aggressively -- deleting phrases, editing in-place. Her involvement rises.

---

### What This Scenario Reveals

| Design aspect | How it performed | Edge case / concern |
|---------------|-----------------|---------------------|
| Goal prompt | Helped Process 2 catch the missing "concerns" angle | What if the goal is vague? ("Write a good essay") |
| Process 1 marking | Low barrier to engagement -- even small edits shift ownership | Novice may still click "Keep as-is" on every pushback |
| Guarded compliance | Quality pushback nudged deeper engagement | Risk of being perceived as patronizing |
| Process 2 | Caught structural gap (missing counterargument) | What if the user intentionally changed direction? |
| Awareness layer | Seeing 38% involvement motivated behavioral change | Does the number cause anxiety rather than reflection? |

---

## Scenario 2: Expert Polishing a Paper

**User profile:** Dr. Park, a senior researcher. Revising the introduction of a journal paper. She has a complete draft and wants AI to help with phrasing, conciseness, and flow -- but has strong opinions about every sentence.

**What this scenario tests:**
- Does fine-grained control serve expert needs without slowing them down?
- Does the system know when to back off?
- Is guarded compliance useful or annoying for experts?
- Does the awareness layer add value when the user is already highly engaged?

---

### Step 1: Goal Setting

```
  "Revising a journal paper introduction. Improve
   phrasing and conciseness. Keep the argument
   structure intact."
```

She chooses **"Start from scratch"** -- she already has text and pastes her existing draft.

---

### Step 2: Dr. Park Selects a Paragraph and Requests AI

She selects her second paragraph and triggers AI generation:

```
  [Despite the growing body of literature on AI-        ]
  [assisted writing, there remains a gap in              ]
  [understanding how users regulate their reliance       ]
  [on AI-generated content during extended writing       ]
  [sessions, particularly in contexts where writing      ]
  [serves as a tool for knowledge construction.          ]
                         ↓  AI generates alternative  ↓
```

AI produces a rephrased version. Inline diff appears:

```
  ~~Despite the growing body of literature on AI-~~
  ~~assisted writing, there remains a gap in~~
  ~~understanding how users regulate their reliance~~
  ~~on AI-generated content during extended writing~~
  ~~sessions, particularly in contexts where writing~~
  ~~serves as a tool for knowledge construction.~~
  → While research on AI-assisted writing has expanded
  → rapidly, little is known about how writers calibrate
  → their reliance on AI across a session -- especially
  → when the act of writing is itself a thinking process.
```

---

### Step 3: Dr. Park Marks Precisely

She likes the conciseness but preserves some of her original phrasing:

- Clicks "calibrate their reliance" → **preserve** (good word choice)
- Clicks "expanded rapidly" → **delete** (too informal for her venue)
- Double-clicks "little is known" → edits to "a critical gap persists in understanding"
- Clicks "the act of writing is itself a thinking process" → **preserve**

```
  ██ a critical gap persists in understanding    (user-edited)
  ██ how writers calibrate                       (AI, preserved)
  ░░ ...                                         (gaps for AI to fill)
  ██ the act of writing is itself a thinking     (AI, preserved)
  ██ process.
```

---

### Step 4: Guarded Compliance -- System Stays Quiet

The system evaluates her marks. Her edits are coherent, structurally sound, and consistent with her goal. **No pushback.** The system recognizes high engagement and does not interrupt.

This is important: guarded compliance is **not always active**. For expert users making deliberate choices, silence is the correct response.

---

### Step 5: AI Regenerates

AI fills the gaps while respecting her preserved and edited segments:

```
  ██ A critical gap persists in understanding how writers
  ██ calibrate their reliance on AI-generated content
  ██ across extended sessions, where the act of writing
  ██ is itself a thinking process.
```

Dr. Park is satisfied. She moves to the next paragraph.

---

### Step 6: Process 2 Does Not Trigger

Dr. Park's edits are consistent with her goal throughout. The system detects no misalignment. Process 2 stays silent. She is never interrupted with directional suggestions.

---

### Step 7: Awareness Layer -- Minimal Value, But Available

Her reliance indicator shows:

```
  [ ■■■■□ 81% ]  ← high user involvement
```

The overlay is mostly blue and purple -- she's writing and editing heavily. The awareness layer confirms what she already knows: she's in control. For Dr. Park, the value is **confirmation**, not correction.

---

### What This Scenario Reveals

| Design aspect | How it performed | Edge case / concern |
|---------------|-----------------|---------------------|
| Goal prompt | Focused AI on phrasing/conciseness, prevented structural suggestions | Expert may find goal prompt unnecessary ("I know what I'm doing") |
| Process 1 marking | Precise control was exactly what she needed | Progressive granularity (word → phrase → sentence) critical for expert use |
| Guarded compliance | Correctly stayed silent -- no false positives | If it had pushed back on expert choices, it would damage trust |
| Process 2 | Correctly stayed silent -- no misalignment | Risk: experts may never see Process 2 and wonder what it does |
| Awareness layer | Low value for already-engaged users | Consider: should the indicator auto-hide when involvement is consistently high? |

---

## Cross-Scenario Comparison

| Dimension | Novice (Mina) | Expert (Dr. Park) |
|-----------|--------------|-------------------|
| Start mode | AI first draft | Paste own text |
| Process 1 behavior | Mostly preserve, few edits | Precise word-level marking |
| Guarded compliance frequency | High (multiple pushbacks) | Low (near-silent) |
| Process 2 triggers | Yes (missing counterargument) | No |
| Awareness value | High (behavioral change driver) | Low (confirmation only) |
| Primary DR addressed | DR3 (reflective space), DR2 (collaborator) | DR4 (fine-grained control) |
| Risk | System feels patronizing | System feels unnecessary |

---

## Open Questions from Scenarios

- [ ] Should guarded compliance intensity adapt to user expertise level? Or should the system treat all users the same?
- [ ] What if a novice clicks "Keep as-is" on every pushback? Should the system escalate, back off, or stay consistent?
- [ ] Should the awareness indicator auto-dim for consistently high-engagement users?
- [ ] How does the system handle the expert's potential perception of "I don't need this"?
- [ ] What happens when a user's goal is too vague to enable misalignment detection?
