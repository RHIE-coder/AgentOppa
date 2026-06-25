# handoff.md — 산출 계약 (의도 브리프)

면담의 산출물 = `.harness/intent.md`. *하네스 설계 의도*를 담아 다음 단계로 넘기는 문서다 — 커밋되면 어느 도구·세션에서 열어도 같은 의도를 집어 든다(resume·크로스툴). 캐는 방법은 [method.md](method.md).

## 경로
`.harness/intent.md` — 하네스 *설계 시 1회* 산출이라 `{feature}` 경로 스킴 밖에 둔다(설계는 기능마다가 아니다). 기능별 요구는 다른 층위다(↓ 재사용).

## 문서 머리말
agent-engineer [contract.md](../../agent-engineer/references/contract.md) §2 양식을 그대로 따른다:

```yaml
---
phase:  intent-interview
status: ready          # draft → (확신 판정 통과) → ready
inputs: []             # 면담은 보통 시작점 (앞 산출물 없음)
---
```

## 브리프 스키마
✓ = `scripts/validate.mjs`가 존재를 확인하는 필수 섹션:

```markdown
# Intent: <한 줄 의도 요약>

## 목표         ✓   결과(기능 아님). "되면 뭐가 달라지나"
## 범위         ✓   할 것(in) / 안 할 것(out) — 비목표 명시
## 제약         ✓   도구·시간·기존자산·반드시/절대
## 예시 / 반례        좋은 사례·싫은 사례 (추상을 땅에 묶음)
## 우선순위      ✓   트레이드오프 서열
## 내린 결정          면담에서 해소된 질문→답 기록 (왜 이렇게 정했나)
## 미해결       ✓   "- 차단:" / "- 비차단:" 으로 분리 (차단 있으면 status=ready 금지)
## 확신         ✓   판정 4체크 결과 + 한 줄 테스트 통과 여부
## 하네스 힌트        제안 작업 묶음·도메인·sync·routing (agent-engineer phase 2 입력)
```

## 연결 — 누가 이 브리프를 받나
agent-engineer **phase 2(Config)**가 읽어 `config.yaml`을 짓고 `{프로젝트값}` 슬롯을 채운다. "하네스 힌트"가 `phases`·`sync`·`routing`·`values`의 출발점이다. 그게 이 브리프의 유일한 소비자다.

> **무엇이 *아닌가*:** intent는 *어떤 하네스를 지을지*(설계 시 1회)다. 하네스가 *돌면서* 만드는 개별 산출물(명세·기능 요구 등)과는 층위가 다르다 — 그건 하네스 안의 작업이 알아서 한다.

## status 규칙
- 확신 판정 4체크 통과 **+ 차단 미해결 없음** → `ready`.
- 차단 미해결이 하나라도 있으면 → `draft`. agent-engineer는 `draft`를 받으면 그 항목부터 되묻는다.
