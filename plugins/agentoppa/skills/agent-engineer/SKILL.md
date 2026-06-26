---
name: agent-engineer
description: 사용자 맞춤 AI 작업 흐름(하네스)을 면담으로 설계·생성할 때 사용. 여러 단계(기획·개발·리뷰·UI 등)를 묶은 워크플로우를 Claude·Codex 양쪽에서 도는 스킬·에이전트·훅으로 조립해준다. "내 워크플로우/파이프라인 만들어줘", "기획부터 개발까지 흐름 세팅", "이 프로젝트용 하네스", "리뷰·QA 자동 흐름", "여러 작업 병렬로 굴리는 흐름" 같은 요청에 적용. 단일 스킬/에이전트/훅 하나만 만드는 일은 해당 ccc-* 스킬로 — 여긴 *여러 개를 흐름으로 엮을* 때.
---

# agent-engineer — 하네스 생성기 (Maker)

ccc-* 메이커가 *부품*(스킬·에이전트·훅·메모리)을 만든다면, agent-engineer는 그 부품으로 **사용자 맞춤 작업 흐름(하네스)을 면담→설계→조립**한다. Core(공장) → Project(맞춤 하네스)의 다리. 전체 개념 모델은 repo `ARCHITECTURE.md`.

> 작성 메타(SKILL 형식·≤500줄·점진 로딩)는 [`ccc-skills`](../ccc-skills/SKILL.md). agent-engineer 자체가 ccc-skills로 만든 스킬이다.

## 핵심 모델 (먼저 이걸 잡아라)

- **Maker다 — 안 돌리고 만든다.** 워크플로우를 각 도구 부품으로 *컴파일*하고, 상태는 **커밋된 산출물 문서**가 든다 (런타임 엔진 없음 → resume·병렬 공짜).
- **산출물 = SOURCE → COMPILED.** 유저가 손대는 `.harness/`(config + core + project) → AgentOppa가 `plugins/<harness>/`(스킬·에이전트·훅 공유 한 트리 + 두 매니페스트) + 루트 마켓으로 굽는다 — AgentOppa 자신과 같은 플러그인 모델. 둘 다 git 커밋(생성물 독립).
- **프레임워크는 여기, 콘텐츠는 프로젝트에.** 규격(`references/`)은 도메인 무관·고정. 실제 phase(콘텐츠)는 *유저의* `.harness/project/phases/`에 산다 — AgentOppa는 샘플 콘텐츠를 싣지 않는다.
- **phase = 작업 한 단계.** frontmatter(구조)+본문(산문). 데이터 모델 → [references/phases.md](references/phases.md).
- **phase는 문서로 이어진다.** 앞 산출물을 뒤 phase가 받는다 → [references/contract.md](references/contract.md).
- **Config = 진실원천.** `.harness/config.yaml`에 고른 phase·순서·강도 → [references/recipe.md](references/recipe.md).

```text
agent-engineer/
├── references/        # 프레임워크 (도메인 무관·고정)
│   ├── phases.md      #   phase 스키마
│   ├── contract.md    #   산출물 계약 (역할→경로·헤더·신선도·연결)
│   └── recipe.md      #   Config (config.yaml·loop·sync·routing)
├── template.md        # 빈 골격 (config + phase + agent)
├── examples/sample.md # 생성된 .harness/ 견본
└── scripts/validate.mjs
```

## When to use
- "워크플로우/파이프라인/하네스 만들어줘", "기획부터 개발까지 흐름", "이 프로젝트용 에이전트 흐름", "리뷰·QA 자동화 흐름", "여러 작업 병렬로".
- **When NOT:** 단일 부품 *하나만* → [`ccc-skills`](../ccc-skills/SKILL.md)·[`ccc-agents`](../ccc-agents/SKILL.md)·[`ccc-hooks`](../ccc-hooks/SKILL.md)·[`ccc-memory`](../ccc-memory/SKILL.md). 여긴 *여러 개를 흐름으로 엮을* 때.

## 5단계 루프

### 1. 면담 — 의도 → 요구
[intent-interview](../intent-interview/SKILL.md)로 위임 — ~95% 확신까지 `.harness/intent.md`(의도 브리프). 어떤 단계·도메인·`sync`·`routing`을 캐고, 막연하면 발산탐색. phase 2가 그 브리프를 입력으로 받는다.

### 2. Config — 합의 → config.yaml
고른 phase·순서·`sync`·`routing`·`values`를 `.harness/config.yaml`로 적어 보여주고 함께 고친다 ([recipe.md](references/recipe.md) 양식).

### 3. 생성 — 컴파일 (스킬-주도)
config의 각 phase를 `.harness/project/phases/<name>.md`에서 읽어(없으면 [phases.md](references/phases.md) 양식대로 *즉석 저작*) **부품으로 컴파일**한다. 펼침:

| phase에 …가 있으면 | 만들 것 | 메이커 |
|---|---|---|
| (항상) | phase 스킬 | [ccc-skills](../ccc-skills/SKILL.md) |
| `workers` | 서브에이전트 (`project/agents/`) | [ccc-agents](../ccc-agents/SKILL.md) |
| `gate` + `sync=strict` | 게이트 훅 | [ccc-hooks](../ccc-hooks/SKILL.md) |
| `produces` | 산출물 문서(헤더) | [ccc-memory](../ccc-memory/SKILL.md) |

본문 슬롯(`{역할}`·`{next}`·`{프로젝트값}`)은 contract·recipe·면담에서 채운다. `when`은 본문 맨 위 self-gate로.

### 4. 포장 — 양쪽 도구로
컴파일된 스킬·에이전트·훅을 `plugins/<harness>/` 공유 트리 + 두 매니페스트(+ 루트 마켓)로 싣는다 → [ccc-plugin](../ccc-plugin/SKILL.md) (포인터·마켓 동기화). 컴포넌트는 한 트리 공유, 도구별로 갈리는 건 매니페스트·마켓뿐.

### 5. 검증
`node .harness/core/validate.mjs`로 연결·누락·신선도·양쪽 일치 점검 ([contract.md](references/contract.md) §4). 각 부품은 그 메이커의 validate로.

## 사용자 자유 (벽 없음)

| 모드 | 무엇 | 어떻게 |
|---|---|---|
| **Author** | 의도에서 phase를 새로 짓는다 (기본 — 맞춤이니까) | [phases.md](references/phases.md) 양식대로 `project/phases/`에 |
| **Tweak** | 빼고·더하고·순서·지시 수정 | `config.yaml`의 `phases` + phase 본문 |

둘 다 "계약을 따르는 phase"라 단절 없음. (구 "프리셋 Pick" 모델은 폐기 — AgentOppa는 샘플 콘텐츠를 싣지 않는다.)

## Gate
- [ ] `.harness/config.yaml` 유효 + 모든 phase가 `project/phases/`에 있거나 생성됨
- [ ] 산출물 계약 연결됨 (dangling·orphan·중복 역할 없음) — [contract.md](references/contract.md) §4
- [ ] 생성 부품이 각 ccc-* validate 통과 + 양쪽 도구에 실림
- [ ] `node .harness/core/validate.mjs` 통과

## Resources
- [references/phases.md](references/phases.md) — phase 데이터 모델 (점)
- [references/contract.md](references/contract.md) — 산출물 계약 (선)
- [references/recipe.md](references/recipe.md) — Config (순서·강도·라우팅)
- [template.md](template.md) — 빈 골격 · [examples/sample.md](examples/sample.md) — `.harness/` 견본
- [../intent-interview/SKILL.md](../intent-interview/SKILL.md) — phase 1 면담 (의도 → `.harness/intent.md`)
- 전체 개념 모델: repo `ARCHITECTURE.md`

## 병렬 (git-workflow) — 고급 🚧 (ROADMAP 보류)

`feature = git worktree` 단위로 N개 동시. 에이전트끼리 **커밋된 문서로** 소통 → 레이스 없음. `decompose → seam-first → fan-out → integrate`. `{feature}` 스코프 + 커밋 문서 구조가 받쳐줌. *본체 위에 얹을 예정.*
