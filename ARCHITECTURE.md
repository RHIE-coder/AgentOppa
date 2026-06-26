# AgentOppa 아키텍처 (개념 가이드)

> 이 문서 = AgentOppa의 **개념 모델**(왜·무엇). 같은 설명을 두 번 안 하려고 한 번에 적는다.
> 정밀 스펙은 스킬별 `references/`, 결정·진행은 `ROADMAP.md`, 늘 지킬 규칙은 `AGENTS.md`, 실행법은 `README.md`.

## 1. 한 줄 — AgentOppa = Maker

안 돌린다, **만든다.** Claude Code·Codex 양쪽에서, 어느 OS에서든 똑같이 도는 **하네스**(harness = 에이전트가 작업을 확실히 해내게 잡아주는 골격)를 짓는 공장.
→ 컴파일러·`create-react-app` 류. **런타임 프레임워크(React 같은)가 아니다.**

## 2. 무엇을 만드나 — Core Layer + Project Layer + Config

생성물의 형식. 그리고 **SOURCE → COMPILED** (= src/dist):

```
.harness/                 ← SOURCE (사람이 손대는 진실 · git 커밋)
├── config.yaml           ·  Config: 배선(켤 Core·phase 순서·게이트·라우팅) + 프로젝트 값(values)
├── intent.md             ·  설계 의도 (왜 이 하네스)
├── core/                 ·  Core Layer: 재사용 배관 (validate.mjs 등). 거의 고정
├── project/
│   ├── phases/<name>.md  ·  Project Layer: 이 프로젝트 phase   (→ 스킬로 컴파일)
│   └── agents/<name>.md  ·  이 프로젝트 보조 에이전트          (→ 에이전트로 컴파일, .md→.toml)
└── artifacts/<feature>/  ·  런타임 산출물 + lock.json

plugins/<harness>/        ← COMPILED 플러그인 (컴포넌트 공유 한 트리 · git 커밋)
├── skills/<phase>/        ·  컴파일된 스킬 (Claude 자동발견 · Codex는 매니페스트 포인터)
├── agents/ · hooks/       ·  공유 컴포넌트 (.md + 빌드된 .toml 등)
└── .claude-plugin/plugin.json · .codex-plugin/plugin.json   ·  두 매니페스트(메타·포인터)
.claude-plugin/marketplace.json · .agents/plugins/marketplace.json  ← 루트 마켓(도구별 어댑터)
```

- 유저는 `.harness/`만 손대고 → AgentOppa가 `plugins/<harness>/`(공유 컴포넌트 트리 + 두 매니페스트) + 루트 마켓으로 **컴파일** — **AgentOppa 자신과 같은 플러그인 모델**(컴포넌트는 한 트리 공유, 도구별로 갈리는 건 매니페스트·마켓뿐. `.claude/`·`.codex/` 복제가 아니다).
- 컴파일 결과는 경로·슬롯이 다 박혀서 **AgentOppa 없이도 돈다**(독립). 그래서 둘 다 커밋.

> ⚠ **이름 주의:** "Maker 엔진"(AgentOppa의 *만드는 능력*) ≠ "Core Layer"(생성물 안의 *재사용 배관*). 둘 다 "core"라 부르면 꼬인다. (옛 README의 "Core Harness Layer / Project Harness Layer" 표현은 이 모델로 대체 예정.)

## 3. 런타임 엔진 안 둔다 (핵심 베팅)

단계 사이 상태 = **커밋된 문서**. 전용 실행기를 안 만든다.
→ resume·병렬·크로스툴이 공짜. 생성물이 도구 네이티브라 독립.

- **허용:** 검사 러너 — 돌고 끝나는 validate (린터·테스트 류).
- **금지:** 워크플로우를 *상주하며 굴리는* 실행기 (HUD·워커팬·auto-resume류).
- 그게 선이다.

## 4. 부품 공장 — ccc-* 패밀리 + 생성기

- **ccc-skills / memory / agents / hooks / plugin** — "에이전트가 X를 확실히" 한 종류씩(스킬·메모리·에이전트·훅·패키징).
- **agent-engineer** — 그 부품으로 하네스를 면담→조립 (Maker 본체).
- **intent-interview** — 짓기 전 의도를 ~95%까지 확정.
- **self-harden** — 정정을 영구 가드로 (아래).

## 5. self-harden — 쓸수록 단단해짐

정정 한 번 → *같은 종류 전체*를 막는 **영구 가드**. 강하고 싼 것부터:
`검사기 > 훅 > 리뷰어 > Gate > 문서 > 항상 켜진 규칙`.

핵심: **LLM이 똑똑해지는 게 아니라 환경(repo)이 단단해진다.** project-committed라 다음 세션·도구·사람이 그 가드를 물려받는다. (정정이 날 때마다 도는 직교 루프 — 선형 phase가 아님.)

## 6. 어디에 무엇이 사나 (문서 지도)

같은 걸 두 번 설명 안 하려면 — 지식은 자리마다:

| 자리 | 무엇 |
|---|---|
| `README.md` | front door + 실행법(Usage) |
| `ARCHITECTURE.md` (이 문서) | 개념 모델 (왜·무엇) |
| `ROADMAP.md` | 결정·계획·진행 |
| `AGENTS.md` | 늘 지킬 횡단 불변식 |
| 스킬별 `references/` | **정밀 스펙** — 스키마·계약·옵션 의미 (가장 깊은 detail) |
| 스킬별 `examples/` | 워크드 견본 |

3층 점진 로딩(ccc-skills): `SKILL.md`(짧은 입구) → `references/`(상세) → `examples/`(견본).

## 7. dogfood (이 repo 자신)

- **실행:** `claude --plugin-dir ./plugins/agentoppa` 로 자기 플러그인 물려 `/self-harden` 등 사용 (→ README Usage).
- **검사:** `npm test` (validator를 red/green fixture에 물림).
- **메모리:** `AGENTS.md` (= ccc-memory: project-committed > 세션 메모리).

---

> 진행 상태(무엇이 빌드됐고 무엇이 설계 단계인지)는 항상 `ROADMAP.md`를 본다. 이 문서는 *모델*, ROADMAP은 *현황*.
