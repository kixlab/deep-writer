# Round Inventory: Storage Units & Coverage Gaps

> Status: Audit snapshot
> Date: 2025-02-10
> Source files: `src/types/contribution.ts`, `src/stores/useRoundStore.ts`, `src/hooks/useGeneration.ts`, `src/extensions/TextStateExtension.ts`, `src/components/editor/CoWriThinkEditor.tsx`

---

## 1. RoundMetadata Schema

Every round is stored as a `RoundMetadata` object in `useRoundStore` (Zustand, in-memory `Map<string, RoundMetadata>`).

```typescript
interface RoundMetadata {
  roundId: string;            // "r-1", "r-2", ...
  roundNumber: number;        // sequential counter
  type: RoundType;            // 'generation' | 'alternative' | 'inline-edit'
  timestamp: number;          // Date.now()
  parentRounds: string[];     // ancestry links
  prompt: string | null;      // user instruction (null for alternatives/inline-edit)
  promptLength: number;
  constraintCount: number;
  constraintTypes: string[];
  generationMode: string;     // see table below
  diffActions: { accepted: number; rejected: number; edited: number };
  events: ProvenanceEvent[];
  editTrace: EditTrace[];     // word-level original→replacement pairs
}
```

---

## 2. Complete Round Type Catalog

### 2.1 `generation` / `regenerate`

| Field | Value |
|---|---|
| **type** | `generation` |
| **generationMode** | `regenerate` |
| **Trigger** | Regenerate 버튼 클릭 |
| **Source file** | `useGeneration.ts` (regenerate flow) |
| **prompt** | goal text (regeneration goal) |
| **parentRounds** | 교체 대상 텍스트(gap)에서 추출한 roundId들 |
| **Flow** | scanDocument → buildRequest → `/api/generate` → DiffEntry 생성 → DiffView에서 review |
| **D1 base** | 0.0 (ai-generated) |
| **D2 base** | promptLength + constraintCount 기반 계산 |
| **D3 base** | userPostAction에 따라 결정 (accepted=0.2, edited=0.7, rejected=1.0) |

### 2.2 `generation` / `smart-edit`

| Field | Value |
|---|---|
| **type** | `generation` |
| **generationMode** | `smart-edit` |
| **Trigger** | Chat 패널에서 edit intent 메시지 전송 |
| **Source file** | `useGeneration.ts` (smartEditRequest flow), `useChat.ts` |
| **prompt** | chat message text |
| **parentRounds** | `[]` (빈 배열 - 문서 전체 수준 편집) |
| **Flow** | Chat → intent 분류('edit') → buildSmartEditRequest → `/api/generate` → computeSmartEditDiffs → DiffEntry 생성 → DiffView에서 review |
| **D1 base** | 0.0 (ai-generated) |
| **D2 base** | promptLength + constraintCount 기반 계산 |
| **D3 base** | userPostAction에 따라 결정 |

### 2.5 `alternative` / `alternative`

| Field | Value |
|---|---|
| **type** | `alternative` |
| **generationMode** | `alternative` |
| **Trigger** | Tooltip에서 대안(alternative) 선택 (Apply 클릭) |
| **Source file** | `CoWriThinkEditor.tsx` (onReplace handler) |
| **prompt** | `null` |
| **parentRounds** | 교체 대상 텍스트에서 추출한 roundId들 |
| **Flow** | 텍스트 선택 → AlternativesTooltip → 대안 목록 요청(`/api/alternatives`) → 사용자 선택 → round 생성 |
| **Insertion** | word/sentence 레벨: 에디터에 직접 삽입. paragraph 레벨: DiffEntry 생성 → DiffView |
| **D1 base** | 0.1 (alt, no edit) 또는 0.5 (alt, with subsequent edit) |
| **D2 base** | 0.3 (alternative base) + prompt/constraint 보정 |
| **D3 base** | alt-selected (0.6) 또는 alt-selected-edited (0.8) |

### 2.6 `inline-edit` / `inline-edit`

| Field | Value |
|---|---|
| **type** | `inline-edit` |
| **generationMode** | `inline-edit` |
| **Trigger** | 사용자가 AI 생성 텍스트(`ai-generated` mark) 위에 직접 타이핑/삭제 |
| **Source file** | `TextStateExtension.ts` |
| **prompt** | `null` |
| **parentRounds** | 편집 대상 AI 텍스트의 roundId |
| **Debounce** | 2초 이내 연속 편집은 동일 round로 병합 |
| **editTrace** | original → replacement 쌍이 기록됨 |
| **D1 base** | 0.5 (user-edited) |
| **D2 base** | 0.0 (prompt 없음, constraint 없음) |
| **D3 base** | edited (0.7) |

---

## 3. Round 생성 위치 요약

| # | Trigger | File:Line | type | generationMode | DiffView 필요 |
|---|---------|-----------|------|----------------|--------------|
| 1 | Regenerate 버튼 | `useGeneration.ts:~110` | generation | regenerate | Yes |
| 2 | Chat edit intent | `useGeneration.ts:~366` | generation | smart-edit | Yes |
| 3 | Tooltip 대안 선택 | `CoWriThinkEditor.tsx:~344` | alternative | alternative | Paragraph만 |
| 4 | AI 텍스트 직접 수정 | `TextStateExtension.ts:~186` | inline-edit | inline-edit | No |

---

## 4. LLM 평가 인터페이스 (`analyze-round` API)

LLM에게 round를 평가시킬 때 전송하는 데이터:

```typescript
interface RoundAnalysisRequest {
  roundId: string;
  actionType: RoundType | 'user-typed';    // 'generation' | 'alternative' | 'inline-edit' | 'user-typed'
  previousText: string;
  resultText: string;
  userPostAction: 'accepted' | 'edited' | 'rejected';
  recentChatHistory: Array<{ role: string; content: string }>;
  userConstraints: Array<{ type: string; text: string }>;
  parentRoundIds: string[];
}
```

LLM이 반환하는 평가:

```typescript
interface RoundAnalysis {
  roundId: string;
  scores: { d1: number; d2: number; d3: number };   // 각 0.0~1.0
  edges: Array<{ to: string; dimension: Dimension; strength: number; reason: string }>;
  conceptsPreserved: string[];
  conceptsAdded: string[];
  conceptsLost: string[];
  narrativeSummary: string;
}
```

---

## 5. Base Score 계산 규칙

### D1 (Wording) - 누가 단어를 선택했는가

| Mark State | Round Type | D1 |
|-----------|-----------|-----|
| user-written | N/A | 1.0 |
| user-edited | N/A | 0.5 |
| ai-generated | generation | 0.0 |
| ai-generated | alternative (후속 편집 있음) | 0.5 |
| ai-generated | alternative (후속 편집 없음) | 0.1 |

### D2 (Concept) - 누가 아이디어/방향을 결정했는가

- Alternative: base 0.3
- Generation: base 0.0
- Prompt 기여: 0 (len=0), +0.1 (<15자), +0.3 (15~50자), +0.5 (>50자)
- Constraint 기여: +0.2/개 (최대 3개, 최대 +0.6)
- 상한: 1.0

### D3 (Evaluation) - 누가 품질을 판단했는가

| Action | D3 |
|--------|-----|
| accepted | 0.2 |
| edited | 0.7 |
| rejected | 1.0 |
| alt-selected | 0.6 |
| alt-selected-edited | 0.8 |

### Composite Score

```
composite = 0.35 * d1 + 0.40 * d2 + 0.25 * d3
```

---

## 6. Coverage Gaps: Round로 포착되지 않는 인터랙션

아래는 현재 시스템에서 **round가 생성되지 않아 LLM 평가 대상에서 빠지는** 인터랙션 목록이다.

### Gap 1: 순수 사용자 작성 텍스트 (User-Written Text)

| 항목 | 내용 |
|------|------|
| **인터랙션** | 에디터에 직접 타이핑 (AI 텍스트 외 영역) |
| **현재 추적** | `ProvenanceEvent('text-typed')` + `user-written` mark state |
| **Round 생성** | No |
| **영향** | D1=1.0이 자동 부여되지만, round 단위 분석(ancestry, concept tracking, narrative)이 불가능 |
| **비고** | `RoundAnalysisRequest.actionType`에 `'user-typed'`가 정의되어 있으나, 실제로 이를 호출하는 코드 경로가 없음 |

### Gap 2: DiffView Accept/Reject 판단 행위

| 항목 | 내용 |
|------|------|
| **인터랙션** | DiffView에서 Accept All / Reject All 클릭, 또는 인라인 diff 클릭 |
| **현재 추적** | 기존 round의 `diffActions` 카운터 증가 (`{ accepted: N, rejected: N, edited: N }`) + `ProvenanceEvent('diff-resolved')`. 또한 modified 패널에서 사용자가 AI 텍스트의 글자를 직접 수정한 경우, 해당 round의 D3가 `accepted`(0.2)→`edited`(0.7)로 업그레이드됨 (`page.tsx:163-173`) |
| **Round 생성** | No (기존 round의 `diffActions` 카운터와 D3 점수만 업데이트) |
| **영향** | `diffActions`에 accept/reject/edited 총 카운트는 기록되지만, **개별 diff 단위의 판단 매핑** (예: diff-A는 accept, diff-B는 reject)이 round에 저장되지 않음. 즉 "5개 diff 중 어떤 3개를 accept하고 어떤 2개를 reject했는지"의 세부 기록이 불가능 |
| **비고** | Keep/Delete로 clause 단위 선택적 수용한 경우, 텍스트 내용 변경이 아니므로 `edited` 감지 로직에 잡히지 않음 (Gap 4 참조) |

### Gap 3: Chat 대화 중 `intent='chat'`인 경우

| 항목 | 내용 |
|------|------|
| **인터랙션** | Chat 패널에서 메시지를 보냈으나 서버가 `intent='chat'`으로 분류한 경우 (질문, 토론, 피드백 요청 등 텍스트 수정을 유발하지 않는 대화) |
| **현재 추적** | `useChatStore`에 메시지 저장만 됨 |
| **Round 생성** | No. `intent='edit'`인 경우에만 `smart-edit` round가 생성되며, `intent='chat'`인 경우에는 round가 전혀 생성되지 않음 |
| **영향** | LLM과의 대화가 사용자의 글쓰기 판단에 영향을 미쳤더라도 (예: "이 부분 논리가 약한 것 같아" 같은 피드백), 해당 대화 자체가 contribution으로 기록되지 않음 |
| **비고** | `analyze-round` API 호출 시 `recentChatHistory`로 최근 대화가 전달되긴 하지만, 이는 다른 round 평가의 맥락 정보일 뿐이며 chat 자체가 독립적 round로 존재하지 않음 |

### Gap 4: DiffSplitView 내 Keep/Delete 부분 선택

| 항목 | 내용 |
|------|------|
| **인터랙션** | DiffSplitView에서 clause 단위로 Keep/Delete 결정 |
| **현재 추적** | `ProvenanceEvent('mark-applied')` + text state mark 변경 |
| **Round 생성** | No |
| **영향** | 사용자가 AI 출력의 어떤 부분을 유지하고 어떤 부분을 삭제했는지에 대한 세분화된 판단이 round로 기록되지 않음 |
| **비고** | 이 행위는 evaluation(D3) 관점에서 중요한 사용자 판단이지만, 현재 round 시스템의 추적 범위 밖에 있음 |

### Gap 5: Tooltip 프롬프트 입력 자체

| 항목 | 내용 |
|------|------|
| **인터랙션** | AlternativesTooltip에서 사용자가 커스텀 프롬프트를 입력하여 대안을 재요청하는 행위 |
| **현재 추적** | API 호출(`/api/alternatives`)만 발생, 대안 선택 시점에 round 생성 |
| **Round 생성** | No (선택 시점에만 생성) |
| **영향** | 사용자가 프롬프트를 3번 수정하며 대안을 탐색한 후 최종 선택한 경우, 탐색 과정(D2, D3에 기여)이 기록되지 않음 |
| **비고** | 최종 `alternative` round에는 `prompt: null`로 저장되어, 사용자가 입력한 프롬프트 정보가 소실됨 |

---

## 7. ProvenanceEvent 전체 목록 (참고)

Round와 별도로 기록되는 이벤트 타입 전체:

| EventType | 설명 | Round와 연결 |
|-----------|------|-------------|
| `text-typed` | 사용자 직접 타이핑 | **Gap 1** |
| `ai-generation-requested` | AI 생성 요청 시작 | Round event에 포함 |
| `ai-generation-received` | AI 생성 응답 수신 | Round event에 포함 |
| `mark-applied` | Keep/Delete 마크 적용 | **Gap 4** |
| `edit-in-place` | 텍스트 인라인 편집 | inline-edit round |
| `prompt-request` | Chat edit / generation 요청 | generation round |
| `diff-resolved` | Diff accept/reject | **Gap 2** |
| `pushback-shown` | Constraint 피드백 표시 | Round 외부 |
| `pushback-response` | Constraint 피드백 응답 | Round 외부 |
| `process2-shown` | Process visualization 표시 | Round 외부 |
| `process2-response` | Process visualization 응답 | Round 외부 |
| `awareness-toggled` | Highlight/inspect 모드 토글 | Round 외부 |
| `goal-changed` | Goal 변경 | Round 외부 |

---

## 8. 요약 다이어그램

```
Interaction                    → Round 생성?   → LLM 평가 대상?
──────────────────────────────────────────────────────────────────
Regenerate 버튼                → Yes (gen/regen)  → Yes
Chat edit intent               → Yes (gen/smart)  → Yes
Tooltip 대안 선택              → Yes (alt)        → Yes
AI 텍스트 직접 수정            → Yes (inline)     → Yes
──────────────────────────────────────────────────────────────────
사용자 직접 타이핑 (비AI 영역) → No  ← GAP 1     → No
DiffView accept/reject         → No  ← GAP 2     → No (기존 round 업데이트만)
Chat 대화 (chat intent)        → No  ← GAP 3     → No
Keep/Delete 부분 선택          → No  ← GAP 4     → No
Tooltip 프롬프트 탐색          → No  ← GAP 5     → No (선택 시에만)
```
