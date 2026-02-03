# Feature: Cognitive Skill Tracking

**Phase**: 2 (After MVP)
**Dependency**: Core engagement tracking system from Phase 1

---

## Overview

단순한 "engagement score"를 넘어서, 글쓰기 과정에서 **어떤 구체적인 skill을 연습했는지** 추적하고 시각화한다.

### Why This Matters

- Engagement가 높아도 **어떤 skill**이 발휘됐는지는 다를 수 있음
- 사용자가 자신의 강점/약점을 파악할 수 있음
- Deskilling (skill decay)을 조기에 발견하고 경고할 수 있음
- AI 시대에 새롭게 요구되는 skill도 추적 가능

---

## Skill Taxonomy

### Traditional Writing Skills

| Skill | Description | Detection Method |
|-------|-------------|------------------|
| **Planning** | 구조/방향 생각하기 | Pause at paragraph start, outline behavior |
| **Idea Generation** | 새로운 내용 만들기 | Original typing without AI prompt |
| **Word Choice** | 적절한 단어 선택 | Drag → Replace, synonym browsing |
| **Sentence Craft** | 문장 구조 다듬기 | Revision within sentence |
| **Organization** | 문단 배치/순서 정하기 | Cut/paste, reordering blocks |
| **Revision** | 다시 읽고 고치기 | Backspace patterns, rewrite behavior |

### AI-era New Skills

| Skill | Description | Detection Method |
|-------|-------------|------------------|
| **Prompt Crafting** | AI에게 좋은 지시 주기 | Prompt specificity, constraints, length |
| **Evaluation** | AI 결과물 판단하기 | View time before accept/decline |
| **Selective Accept** | 골라서 수락하기 | Partial accept, decline patterns |
| **Integration** | AI 텍스트를 내 목소리로 | Edit after accept |
| **Iterative Refinement** | 대화로 개선해나가기 | Multi-turn conversation depth |

---

## Skill Detection Logic

### Behavior → Skill Mapping

```
BEHAVIOR                              SKILL PRACTICED
──────────────────────────────────────────────────────────────────────
Pause > 5sec at paragraph start   →   Planning +
Type original text (no AI)        →   Idea Generation +, Word Choice +
Drag → view alternatives          →   Word Choice +
Backspace + rewrite               →   Revision +
Cut/paste text blocks             →   Organization +

Write specific prompt             →   Prompt Crafting +
View diff > 5sec before action    →   Evaluation +
Partial accept                    →   Selective Accept +, Evaluation +
Decline AI suggestion             →   Evaluation +
Edit after accept                 →   Integration +
Multi-turn refinement             →   Iterative Refinement +
```

### Skill Score Calculation

각 skill은 해당 행동이 발생할 때마다 점수 누적:

```
Skill_Score = Σ (behavior_occurrence × weight × quality_factor)

Where:
- behavior_occurrence: 해당 행동 발생 횟수
- weight: skill별 기본 가중치
- quality_factor: 행동의 quality (e.g., pause 길이, prompt 구체성)
```

---

## UI Design

### Session View: Current Skills

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 Your Writing Skills (This Session)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TRADITIONAL SKILLS                                                         │
│  ───────────────────────────────────────────────────────────────────────── │
│  Planning         ████████░░░░░░░░░░░░   42%   ↑ practiced today            │
│  Idea Generation  ██████████████░░░░░░   68%   ↑↑ strong today              │
│  Word Choice      ██████░░░░░░░░░░░░░░   31%   → average                    │
│  Revision         ████████████░░░░░░░░   55%   ↑ practiced today            │
│                                                                             │
│  AI-ERA SKILLS                                                              │
│  ───────────────────────────────────────────────────────────────────────── │
│  Prompt Crafting  ██████████░░░░░░░░░░   48%   ↑ improving                  │
│  Evaluation       ████░░░░░░░░░░░░░░░░   22%   ↓ quick accepts today        │
│  Selective Accept ██████████████████░░   85%   ↑↑ used partial accept       │
│  Integration      ████████░░░░░░░░░░░░   40%   → some editing after AI      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Historical View: Skill Growth Over Time

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📈 Skill Growth (Last 30 Days)                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Planning                                                                   │
│  Week 1: ████░░░░░░                                                         │
│  Week 2: █████░░░░░                                                         │
│  Week 3: ███████░░░                                                         │
│  Week 4: █████████░  ↑ 25% growth                                           │
│                                                                             │
│  Evaluation (AI 결과물 판단)                                                 │
│  Week 1: ██░░░░░░░░                                                         │
│  Week 2: ███░░░░░░░                                                         │
│  Week 3: ██░░░░░░░░  ← dip (relied on AI more)                              │
│  Week 4: █████░░░░░  ↑ recovering                                           │
│                                                                             │
│  💡 Insight: "Evaluation skill이 Week 3에 떨어졌어요.                        │
│              AI 제안을 더 천천히 검토해보세요."                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Segment Detail: Skill Breakdown per Text

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  This segment's engagement: 72%                 │
│                                                 │
│  Skills practiced:                              │
│  ├─ Planning (pause before)        15%          │
│  ├─ Word Choice (drag replace)     12%          │
│  ├─ Evaluation (viewed diff)       20%          │
│  ├─ Integration (edited after)     25%          │
│  └─ Base (accepted AI text)         0%          │
│                                    ────          │
│                              Total: 72%          │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Deskilling Detection & Alerts

### What is Deskilling?

AI에 의존하면서 특정 skill이 점점 사용되지 않아 퇴화하는 현상.

### Detection Logic

```
Deskilling Alert Trigger:
├─ Skill not practiced for > 2 weeks
├─ OR skill usage dropped > 50% from baseline
├─ OR skill consistently below 20% for 3+ sessions
```

### Alert UI

```
┌────────────────────────────────────────────────┐
│                                                │
│  ⚠️ Skill Decay Alert                          │
│                                                │
│  "Idea Generation" skill이 2주간 연습 안 됨     │
│                                                │
│  최근 패턴:                                     │
│  - AI에게 첫 문장 요청: 85%                     │
│  - 직접 시작한 문단: 15%                        │
│                                                │
│  💡 다음 문단은 직접 시작해보시겠어요?           │
│                                                │
│          [Try it]  [Dismiss]                   │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Adaptive AI Support (Future)

note5에서 언급: "역으로 쌓고 싶은 skill을 선택하면 AI의 support mode가 바뀜"

### Concept

사용자가 연습하고 싶은 skill을 선택하면, AI가 그 skill을 연습할 수 있도록 도움을 조절함.

```
┌────────────────────────────────────────────────┐
│                                                │
│  🎯 Today's Focus: Idea Generation             │
│                                                │
│  AI will:                                      │
│  ✗ Not suggest opening sentences              │
│  ✗ Not auto-complete new paragraphs           │
│  ✓ Help with revision after you write         │
│  ✓ Suggest alternatives when you ask          │
│                                                │
│          [Change Focus]  [Turn Off]            │
│                                                │
└────────────────────────────────────────────────┘
```

### Skill → AI Behavior Mapping

| Focus Skill | AI Restriction |
|-------------|----------------|
| Idea Generation | No first-sentence suggestions |
| Planning | No structure suggestions, only help after outline |
| Word Choice | Suggestions only when explicitly asked |
| Evaluation | Show multiple options, require explicit choice |
| Revision | No auto-corrections, only highlight potential issues |

---

## Connection to Phase 1 (Engagement)

### How Skills Feed into Engagement

Phase 1의 engagement score는 Phase 2에서 skill로 분해됨:

```
Phase 1: Engagement = 72% (single number)

Phase 2: Engagement = 72% (broken down)
         ├─ Planning:    15%
         ├─ Word Choice: 12%
         ├─ Evaluation:  20%
         └─ Integration: 25%
```

### Data Compatibility

Phase 1에서 수집하는 데이터가 Phase 2 skill 분석에 그대로 사용됨:
- Keystroke patterns → Planning, Revision, Word Choice
- Pause analysis → Planning, Idea Generation
- Accept/Decline behavior → Evaluation, Selective Accept
- Post-accept editing → Integration
- Prompt content → Prompt Crafting

---

## Implementation Notes

### Phase 2 Prerequisites

1. Phase 1 engagement tracking 완료
2. 충분한 user data 축적 (skill detection model 검증용)
3. Pause inquiry (ESM) data로 skill mapping validation

### Technical Considerations

- Skill scores need normalization across users (개인차 고려)
- Historical data storage for growth tracking
- ML model for behavior → skill inference (optional, rule-based로 시작 가능)

### Research Validation

- Skill detection accuracy를 ESM (pause inquiry)로 검증
- "연습했다"는 느낌과 실제 skill score의 correlation 확인
- Deskilling alert의 효과 측정 (행동 변화 유도하는지)

---

## Open Questions

1. Skill 간 상관관계: 어떤 skill이 함께 발달하는가?
2. 개인화: 사람마다 baseline이 다를 텐데 어떻게 calibrate?
3. Gamification: Skill growth를 게임화하면 동기부여 될까, 아니면 부담될까?
4. Skill 정의: 현재 taxonomy가 충분한가? 더 세분화/통합 필요?
