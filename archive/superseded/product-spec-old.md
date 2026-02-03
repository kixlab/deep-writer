# deep-writer: Product Specification

## Overview

**deep-writer**는 AI-assisted writing 환경에서 사용자의 **cognitive engagement**를 시각화하고, 사용자가 자신의 콘텐츠에 대한 **실질적인 agency**를 가질 수 있도록 돕는 도구이다.

### Core Problem

AI와 함께 글을 쓸 때, 사용자는 종종 "이게 내 글인가?"라는 의문을 갖게 된다. 단순히 AI가 썼는지 내가 썼는지의 이진법적 구분이 아니라, **얼마나 의식적으로 관여했는지**가 진짜 ownership을 결정한다.

### Solution

텍스트의 배경색에 **그라데이션**을 적용하여 engagement 수준을 실시간으로 시각화한다. 사용자는 낮은 engagement 영역을 발견하고, 해당 부분에 인지적 자원을 재배분하여 리뷰할 수 있다.

### Core Value Proposition

> "See where you're disengaged → Focus attention there → Actually own your content"

---

## UI Layout

Cursor/ChatGPT Canvas 스타일의 dual-pane 레이아웃:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  deep-writer                                              [Engagement ▼] [Settings] │
├───────────────────────────────────────────────┬─────────────────────────────────────┤
│                                               │                                     │
│  CANVAS (Writing Area)                        │  AI ASSISTANT (Chat)                │
│                                               │                                     │
│  - 텍스트 작성 영역                            │  - AI와 대화                         │
│  - 배경색 그라데이션으로 engagement 표시        │  - 요청하면 Canvas에 diff로 반영      │
│  - Diff view (green/red) for AI changes       │                                     │
│  - Accept/Decline buttons                     │                                     │
│                                               │                                     │
├───────────────────────────────────────────────┴─────────────────────────────────────┤
│  Engagement Bar: ██████████████░░░░░░░░░░░░ 58%    │  ░ low  ▓ medium  █ high        │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Interaction Types

### 1. Direct Typing
사용자가 직접 키보드로 타이핑하는 경우.

- **Base engagement**: 90-100%
- **추가 요소**:
  - Pause patterns (thinking) → engagement 증거
  - Revision behavior (backspace, rewrite) → 깊은 관여 증거

### 2. Tab Autocomplete
인라인으로 AI 제안이 나타나고 Tab으로 수락하는 경우.

- **Base engagement**: 20%
- **수정 요소**:
  - Time before accept: 길수록 ↑
  - Post-accept editing: +30%
  - Rejection history: reject를 많이 했다면 accept가 더 의미있음 +15%

### 3. Drag → Replace
특정 텍스트를 드래그하여 대체 표현을 제안받고 선택하는 경우.

- **Base engagement**: 50%
- **수정 요소**:
  - Multiple options viewed: +10% per option
  - Time spent choosing: 길수록 ↑
  - Further editing after replace: +20%

### 4. Chat → Diff → Accept/Decline
AI Assistant에 요청하면 Canvas에 자동으로 diff가 반영되고, 사용자가 Accept/Decline하는 경우.

**Diff Display:**
```
┌─ Pending Changes ───────────────────────┐
│                                         │
│ - facing humanity today. Rising         │  (red: 삭제될 부분)
│ - temperatures, extreme weather events, │
│                                         │
│ + facing humanity right now. Rising     │  (green: 추가될 부분)
│ + temperatures and deadly weather are   │
│ + no longer predictions—they are our    │
│ + daily reality.                        │
│                                         │
│          [✓ Accept]  [✗ Decline]        │
└─────────────────────────────────────────┘
```

**Engagement 계산:**

| Action | Engagement |
|--------|------------|
| 즉시 Accept (< 2초) | 20% |
| Diff 확인 후 Accept (2-10초) | 50% |
| 오래 검토 후 Accept (> 10초) | 70% |
| Accept 후 추가 수정 | +20% |
| Decline → 직접 다시 씀 | 90% |
| Decline → 다른 프롬프트로 재요청 | 60% |
| Decline → 원본 유지 | 50% |
| 일부만 Accept (Partial) | 80% |
| Accept 후 일부 되돌림 | 85% |

---

## Engagement Visualization

### Gradient Background Color

텍스트의 각 segment(문장 또는 phrase)에 배경색 그라데이션 적용:

```
높은 engagement (진한 색)              낮은 engagement (연한 색)
████████████████████████              ░░░░░░░░░░░░░░░░░░░░░░░░
```

### Engagement Score Calculation

각 텍스트 segment의 engagement는 4가지 요소의 가중 평균:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Origin** | 25% | 누가 썼는가? (typed → AI raw) |
| **Process** | 25% | 어떻게 수락했는가? (long pause → instant accept) |
| **Revision** | 30% | 수정했는가? (rewrote → no change) |
| **Validation** | 20% | 리뷰했는가? (re-read → skipped) |

```
Final Score = Origin×0.25 + Process×0.25 + Revision×0.30 + Validation×0.20
```

---

## Core User Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Write     │ ──▶ │  See gaps   │ ──▶ │   Review    │ ──▶ │  Own it     │
│  (AI 포함)   │     │ (연한 부분)  │     │ (재검토)     │     │ (진짜 내 글) │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Review Mode

낮은 engagement 영역 클릭 시 Review Mode 진입:

```
┌─ Section needing attention ─────────────────────────────┐
│                                                         │
│  "and biodiversity loss threaten not just ecosystems"   │
│                                                         │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 12%        │
│                                                         │
│  📊 Why low engagement:                                 │
│     • AI generated via chat                            │
│     • Accepted in 0.8 seconds                          │
│     • No revision, no re-reading detected              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [✏️ Rewrite myself]      → highest engagement gain     │
│  [🔄 Request alternatives] → choose deliberately       │
│  [✓ Mark as reviewed]     → conscious acceptance       │
│  [→ Skip]                                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Engagement Validation: Mouse Cursor + Behavioral Ceiling

### Why Mouse Cursor (Not Eye-tracking)

| Factor | Eye-tracking (Webcam) | Mouse Cursor |
|--------|----------------------|--------------|
| Accuracy | ~100-200px (rough) | Exact position |
| Reliability | Varies (lighting, calibration) | 100% reliable |
| Privacy | High concern (camera) | Low concern |
| Setup | Calibration needed | None |

**Decision**: Mouse cursor + behavioral ceiling approach

### Engagement Ceiling by Behavior Type

Passive behavior (보기만) has a ceiling. Active behavior (행동함) can reach higher engagement.

**Philosophy**: `Looking < Thinking < Doing`

```
PASSIVE (viewing only)                              MAX CEILING
─────────────────────────────────────────────────────────────────
Diff appeared, no cursor movement                    30%
Cursor hovered over diff area                        45%
Cursor moved line-by-line (reading pattern)          60%

ACTIVE (doing something)                            MAX CEILING
─────────────────────────────────────────────────────────────────
Accept after viewing                                 70%
Decline → request alternative                        75%
Partial accept (some lines only)                     85%
Accept → then edit further                           90%
Decline → rewrite yourself                          100%
```

### Engagement Formula

```
Final Engagement = min(Passive_Score, Passive_Ceiling) + Active_Bonus
```

**Example**:
- User views diff 30sec (would be 80%, but ceiling 60%) + Accept (+10%) = **70%**
- User glances 2sec (15%) + quick Accept (+5%) = **20%**
- User views 10sec (40%) + Decline + rewrite (+50%) = **90%**

---

## Pause Interpretation

### The Problem

| Context | Long pause means... |
|---------|---------------------|
| Viewing diff | Maybe 멍하니 보는 것 (low value) |
| Writing | Maybe 깊이 생각하는 것 (high value) |

Same behavior, different meaning.

### Solution: Multi-signal Analysis

#### 1. Context-Dependent Interpretation

```
WRITING CONTEXT (cursor in text area, no diff pending)
─────────────────────────────────────────────────────
Pause 5-30sec  → Likely thinking, planning    → Engagement +
Pause > 60sec  → Maybe distracted             → Neutral

DIFF REVIEW CONTEXT (diff is pending)
─────────────────────────────────────────────────────
Pause 2-10sec  → Reading/reviewing            → Engagement + (capped)
Pause > 30sec  → Probably not reviewing       → No additional +
```

#### 2. What Comes After the Pause (Burst Analysis)

```
Pause → 긴 문장/문단 작성    → "생각하고 있었구나"  → High engagement
Pause → 짧은 수정만          → "잠깐 멈춘 것"      → Medium engagement
Pause → 아무것도 안 씀       → "딴짓했나?"         → Low engagement
Pause → AI에게 요청          → "뭘 쓸지 몰랐구나"  → Low engagement
```

#### 3. Pause Location Analysis

| Pause Location | Likely Meaning | Multiplier |
|----------------|----------------|------------|
| 문단 시작 전 | Planning (high cognitive load) | ×1.5 |
| 문장 중간 | Word search (medium) | ×1.0 |
| 문장 끝 | Reviewing what I wrote | ×1.0 |
| 랜덤하게 | Distraction (low) | ×0.5 |

#### 4. Micro-movements During Pause

| During Pause | Signal | Multiplier |
|--------------|--------|------------|
| Cursor 미세하게 움직임 | 화면 보고 있음 | ×1.2 |
| 스크롤 up/down | 이전 내용 참고 중 | ×1.3 |
| 텍스트 선택했다 해제 | 고민 중 | ×1.2 |
| 완전 정지 | 딴짓 or 깊은 생각 (모호) | ×0.8 |

### Pause Engagement Formula

```
Base Score = f(pause_duration, context)

Multipliers:
├─ Location: 문단 시작 전 ×1.5, 문장 중간 ×1.0, 랜덤 ×0.5
├─ After-pause output: 긴 텍스트 ×1.5, 짧은 수정 ×1.0, AI 요청 ×0.3
├─ Micro-movement: 있음 ×1.2, 없음 ×0.8
└─ Context: Writing ×1.0, Diff review ×0.7 (ceiling 적용)

Final = min(Base × Multipliers, Context_Ceiling)
```

---

## Real-time Pause Inquiry (Experience Sampling)

### Purpose

1. **Research validation**: Ground truth 수집 → 모델 검증/개선
2. **User self-reflection**: 사용자가 자기 행동을 인식하게 함 (메타인지)

### Popup Design

```
┌────────────────────────────────────────────┐
│                                            │
│  🤔 15초 동안 멈추셨네요.                   │
│     무엇을 하고 계셨나요?                   │
│                                            │
│  ○ 다음에 뭘 쓸지 생각 중                  │
│  ○ 방금 쓴 내용 다시 읽는 중               │
│  ○ 적절한 단어/표현 찾는 중                │
│  ○ 잠깐 딴생각/휴식                        │
│  ○ 다른 자료 찾아보는 중                   │
│                                            │
│              [Skip]  [Submit]              │
└────────────────────────────────────────────┘
```

### Trigger Rules

```
WHEN to ask:
├─ Pause > threshold (e.g., 15초)
├─ AND last popup was > 5분 ago (피로 방지)
├─ AND model is uncertain (signals are ambiguous)
└─ OR random sampling (연구용: 10% of pauses)

WHEN NOT to ask:
├─ User disabled popups
├─ Too frequent (cooldown period)
└─ Obvious context (e.g., just switched tabs = researching)
```

### Model Improvement Loop

```
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│ Observe │ ──▶  │  Infer  │ ──▶  │   Ask   │ ──▶  │ Compare │
│ signals │      │ engage- │      │  user   │      │ & learn │
│         │      │  ment   │      │         │      │         │
└─────────┘      └─────────┘      └─────────┘      └─────────┘
     │                                                   │
     └───────────────────────────────────────────────────┘
                      Feedback loop
```

Over time: Model learns which signals correlate with which actual behaviors.

---

## Technical Considerations

### Data to Track

1. **Keystroke events**: timestamp, key, position
2. **Pause durations**: time between keystrokes
3. **Pause location**: where in text the pause occurred
4. **After-pause output**: what was typed after pause
5. **Mouse cursor**: position, movement patterns, micro-movements
6. **Selection events**: drag start/end positions
7. **AI interactions**: prompts, responses, prompt specificity
8. **Diff interactions**: view duration, cursor hover, accept/decline timing
9. **User self-report**: pause inquiry responses (ground truth)

### Privacy Note

모든 데이터는 로컬에서 처리되며, engagement 계산은 클라이언트 사이드에서 수행됨.

---

## Summary Table

| Interaction | Description | Engagement Range |
|-------------|-------------|------------------|
| Direct typing | 직접 타이핑 | 90-100% |
| Tab accept | 인라인 제안 수락 | 20-50% |
| Drag → Replace | 드래그 후 대안 선택 | 40-70% |
| Chat → Accept | 채팅 → diff → 수락 | 20-70% |
| Chat → Decline | 채팅 → diff → 거절 | 50-90% |
| Chat → Partial | 일부만 수락 | 70-85% |

---

## Additional Features

### 1. Partial Accept (Line-by-line)

Accept/Decline을 전체가 아닌 line-by-line으로 선택 가능:

```
┌─ Pending Changes ───────────────────────┐
│                                         │
│ [✓] + facing humanity right now.        │  ← 개별 체크박스
│ [ ] + Rising temperatures and deadly    │
│ [✓] + weather are no longer predictions │
│ [ ] + —they are our daily reality.      │
│                                         │
│      [Apply Selected]  [Accept All]     │
└─────────────────────────────────────────┘
```

Partial accept = 80-85% engagement (의식적 선별)

### 2. Prompt Quality as Engagement Factor

같은 AI 결과라도 prompt의 구체성에 따라 engagement 다름:

| Prompt | Engagement Bonus |
|--------|------------------|
| "써줘" | +0% |
| "더 강하게 써줘" | +5% |
| "청소년 독자 대상으로, 희망적 톤으로, 구체적 사례 포함해서 써줘" | +20% |

**Prompt specificity scoring**: Length, constraints mentioned, audience specified, tone specified 등

### 3. View Mode Toggle

```
Engagement View: [Off] [On-demand] [Always]

Off        → Clean writing, no visualization
             (tracking은 background에서 계속)

On-demand  → 버튼 누르면 현재 상태 보여줌
             "Show my engagement" 클릭 시만 표시

Always     → 실시간 그라데이션 (opt-in 사용자만)
```

### 4. Session Summary

글쓰기 세션 종료 시 요약 제공:

```
┌─ Session Summary ─────────────────────────────┐
│                                               │
│  📝 Total words: 847                          │
│  ⏱  Time: 45 min                              │
│                                               │
│  Your engagement breakdown:                   │
│  ├─ Direct typing:      52%  ████████████░░░░ │
│  ├─ AI accepted:        31%  (avg 48% engaged)│
│  └─ AI declined/edited: 17%                   │
│                                               │
│  💡 가장 engaged했던 부분: 3번째 문단          │
│  ⚠️ 리뷰 추천: 2번째 문단 (24% engagement)     │
│                                               │
└───────────────────────────────────────────────┘
```

---

## Target User & Ecological Validity

### Who Would Use This?

**Primary**: AI 글쓰기 도구를 쓰면서 **자신의 학습/성장이 걱정되는** 사용자

| Context | User Need | How deep-writer helps |
|---------|-----------|----------------------|
| **Self-improvement** | "AI에 의존하는 것 같아서 걱정" | Self-coaching tool |
| **Pre-submission check** | "제출 전에 진짜 내가 쓴 건지 확인" | On-demand review mode |
| **Portfolio/Proof** | "이게 내 실력이라는 걸 증명하고 싶어" | Engagement report export |
| **Writing coach** | "학생이 어떻게 AI를 쓰는지 이해하고 싶어" | Coaching dashboard |

### Why Not "Surveillance Feeling"?

- **Opt-in**: 사용자가 자발적으로 켬
- **Self-directed**: 감시가 아니라 거울 (self-awareness)
- **Actionable**: 단순 측정이 아니라 개선 방향 제시
- **Mode toggle**: 방해되면 끌 수 있음

---

## Research Contribution

### Novel Aspects

| Existing Research | deep-writer Contribution |
|-------------------|--------------------------|
| Binary attribution (human vs AI) | **Engagement gradient** (연속적 스펙트럼) |
| Post-hoc analysis | **Real-time visualization** |
| Passive measurement | **Actionable feedback** (리뷰 유도) |
| Text-level ownership | **Process-level engagement** |

### Potential Venues

| Venue | Fit | Framing |
|-------|-----|---------|
| **CHI** | ★★★★★ | Human-AI interaction design |
| **CSCW** | ★★★★☆ | Collaborative writing |
| **L@S / LAK** | ★★★★☆ | Learning analytics |
| **IUI** | ★★★★☆ | Intelligent UI |

### Key Research Questions

1. Does engagement visualization change user behavior? (더 리뷰하게 되는가?)
2. Does higher engagement lead to better outcomes? (quality, learning, satisfaction)
3. Can behavioral signals accurately predict cognitive engagement? (model validation)

---

## Open Questions

1. Engagement threshold: 몇 % 이하를 "needs attention"으로 표시할 것인가?
2. Segment granularity: 문장 단위? 구 단위? 단어 단위?
3. Historical view: 시간에 따른 engagement 변화를 보여줄 것인가?
4. Export format: 최종 결과물에서 engagement 정보를 어떻게 표시/제거할 것인가?
5. Calibration: 개인마다 pause 패턴이 다를 텐데, 개인화 필요한가?
