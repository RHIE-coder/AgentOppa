# AgentOppa ROADMAP

> 세션은 죽어도 repo는 안 죽는다. 계획은 *세션 메모*가 아니라 **여기** 산다 — 다음 세션(누구든)이 읽고 잇는다. 이게 우리가 설파하는 ccc-memory(project-committed > 세션 메모리). 자기 약 먹기(dogfood). *(이 파일은 2026-06-23 재설계 합의를 박은 것.)*

## 정체성 (확정)

**AgentOppa = Maker.** 안 돌린다, **만든다.** 산출물 형식 = **Core Layer + Project Layer + Config.**

- **Maker 엔진** — AgentOppa의 *만드는 능력*(agent-engineer 등). ⚠ 아래 "Core Layer"와 **다른 것** (이름 구분 — 둘 다 "Core"라 부르면 꼬임).
- **Core Layer** — 산출물의 *재사용 배관*: 역할→경로 · 문서 핸드오프 · 헤더 형식 · 신선도 · 검증. 프로젝트 무관 → 플러그인으로 빌드 가능.
- **Project Layer** — *이 프로젝트만의 것*: 실제 phase + 프로젝트 값(테스트 명령 등). bespoke.
- **Config** — 둘의 *배선* (= 구 `harness.yaml`).

## 확정 결정

- **cookbook 삭제.** Core는 *만드는 능력*(고정 메뉴 아님), 예시는 그냥 예시 → 엔진의 cookbook 의존을 끊는다(`validate.mjs` 탈-cookbook).
- **기계가 읽는 데이터 → frontmatter** (스키마 검증), 산문은 본문. (지금: .md 산문 속 yaml 토막 + regex = 취약.)
- **AgentOppa 자기검사 자동 러너** = 테스트 + 기계 가드를 한 몸으로. "검사 돌고 끝" = 런타임 엔진 아님.
- **repo dogfood** = `--plugin-dir`로 로컬 플러그인 로드(`/self-harden` 등). Codex는 `.agents/plugins/marketplace.json` 자동 감지.
- **AGENTS.md 정리** — "쉬운 말" 중복 줄 제거(플러그인 always-on이 커버), cookbook 참조 2줄(프레임워크≠콘텐츠 · core↛disposable) 갱신.

## 현재 상태 (2026-06-23)

- **Maker 모델 라이브.** `agent-engineer` + `intent-interview` 새 모델로 리프레임 완료(`.harness/` · `config.yaml` · frontmatter phase). cookbook 삭제됨.
- `ccc-*` 5종 · 모델 라우팅 — 작동 (makers는 모델 무관이라 그대로).
- **`self-harden` 개선 완료** — 키워드 주입 · 수단 순차판정 · 산출물(범용)/로그 분리 · 7단계 출력(제목=교훈 요약). `always-on.md`에 "삭제·개명 완료 기준" 규칙 + `.agentoppa/hardening-log.md` 신설(첫 엔트리 = cookbook 사건).
- 검사 러너 `npm test` **8/8** — validator 3종(ccc-plugin · agent-engineer · intent-interview) red/green + 프로파일러 정적 리포트 2종(`test/profiler.test.mjs`).
- 문서 4종(README · ARCHITECTURE · AGENTS · 이 파일) Maker 모델로 정렬.
- ⚠ **아직 라이브 generate+run end-to-end는 없음** — 정적 contract는 이제 프로파일러가 green fixture의 실제 `.harness/`를 소비하며 처음 행사함(A-2 정적 반쪽). 남은 미지수 = agent-engineer를 진짜 프로젝트에 면담→생성→*실행*해 첫 하네스를 돌리는 것 → A-2 dynamic 반쪽에서(target 프로젝트 결정 필요).

## 로드맵

### Phase 0 — 토대 (독립 항목) ✅ 완료
- [x] **A-1 / C** 검사 러너 (`npm test` = `node --test "test/**/*.test.mjs"`) — red 실패·green 통과 확인. 현재 규칙 1개(ccc-plugin 결합); 규칙 늘 때 `test/validators.test.mjs`의 `CASES`에 한 줄씩.
- [x] **B(부분)** `AGENTS.md` "쉬운 말" 중복 줄 제거 (always-on.md가 커버)
- [x] `.agentoppa/harness.yaml` 삭제 — 안 돌던 dead 하네스. AgentOppa는 self-harden 직교 루프 + 검사 러너로 dogfood.
- [x] **항목5** README 실행법(`--plugin-dir` / codex)
- [x] **ARCHITECTURE.md** 신설 — 개념 가이드(재설명 방지). Phase 1 구현하며 정밀화.

### Phase 1 — 레이아웃 + 엇물린 정리 (한 덩어리)

**레이아웃 확정 (2026-06-23):** SOURCE `.harness/`(`config.yaml` + `core/` + `project/phases/` + `artifacts/`) → COMPILED `.claude/`·`.codex/`. **둘 다 git 커밋**(생성물이 독립이라). 유저는 `.harness/`만 손대고 AgentOppa가 컴파일. (= src/dist.)

- [x] **8-1/8-2** 구조를 references(contract·recipe·phases) + SKILL + template + examples에 반영
- [x] **D** phase·config frontmatter(구조)+본문(산문) + validate가 frontmatter 파싱·점검
- [x] **항목3** cookbook 삭제 + `validate.mjs` 재작성(pack 비의존, `.harness/` 기준) + `AGENTS.md` 2줄
- [x] 새 validate red/green fixture(`agent-engineer-config`) + 검사 러너 등록 — `npm test` 4/4
- [x] **README 전면 reframe** — Concept→Maker · 쿡북·card·harness.yaml·옛경로 제거 (stale grep clean)
- [x] **intent-interview 리프레임** — `.harness/intent.md` · `config.yaml` · `pack` 제거 + red/green fixture → 검사 러너 6/6 (validator 3종 다 커버)

### 그 위 — 별도 빌드 (각각 독립) ← **여기가 다음**

> Phase 0·1(토대 + 모델 전환) 완료 = 자연 진입점. **A-2 착수**(2026-06-23): 정적/동적 두 반쪽으로 쪼개 **정적 먼저** — 라이브 실행 없이 green fixture로 즉시 검증되고, 토큰·시간은 라이브 세션 로그가 필요해 target 프로젝트 결정과 함께 dynamic 반쪽으로 미룸.

- [ ] **step 6** 프로젝트 파악(스택 · 구조 · 기존 하네스) + **마이그레이션**
- [ ] **8-3** 재사용 **플러그인 빌드** 산출 (Phase 1 선행 필요)
- **A-2** Extension — 하네스 **프로파일러** (한 세션의 토큰·시간·워크플로우 타당성 → 콘솔 UI + 참고용 `ANALYZED.md`):
  - [x] **정적 반쪽** — `plugins/agentoppa/bin/profile-harness.mjs`: `.harness/` config+phase 그래프 → 분석객체 1개 → **JSON(데이터) + 자기완결 HTML(`file://`로 열기 · JSON 내장 · 서버 없음) + 콘솔** 3뷰(한 소스, 드리프트 0). green fixture에 물려 `test/profiler.test.mjs` 통과(8/8). 셋 다 참고용(contract 산출물 아님·lock 무관·artifacts/ 밖·엔진이 도로 안 먹음). `.gitignore`로 산출 커밋 차단.
  - [ ] **동적 반쪽** — 토큰·시간: 도구 세션 로그 어댑터(Claude transcript JSONL · Codex 로그) + 실제 artifacts/lock.json. **target 프로젝트 결정 필요**(어디에 하네스 깔고 라이브 실행) → 이게 모델 generate+run end-to-end 증명도 겸함.
  - [ ] (후속·작음) config+phase 파서가 `validate.mjs`·`profile-harness.mjs` 두 곳 중복 → `core/` 공용 모듈로 추출(드리프트 방지). · 정적 프로파일러를 LLM-facing으로 감싸는 얇은 skill(리포트 읽는 법).

## 의도적 제외 (베팅 유지)

- **상주형 런타임 엔진**(워크플로우를 상주하며 실행·조율; HUD·tmux 워커팬·auto-resume)은 **안 한다** — 크로스툴이라 전용 런타임 안 두는 게 베팅. 대신 **컴파일 + 커밋된 문서**로 주고받기.
- 단 **검사 러너**(돌고 끝나는 validate)는 허용 — *워크플로우 실행기*와 구분한다(그게 선).

## 보류 (나중 재검토)

- 이전 ROADMAP의 **병렬(git-workflow 프리셋)** · **Mode B(skillify — 생성된 하네스가 쓸수록 학습)** — 지금 범위 밖. 안 잊으려 적어둠.
- **self-harden 후속(작음)** — ① 범용 dangling-reference 검사기(링크형 잔재 자동 검출) ② 출력 형식·순차판정의 *기계적* 강제(지금은 스킬 문서 가이드 수준). 둘 다 선택.
