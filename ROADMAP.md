# AgentOppa ROADMAP

> 세션은 죽어도 repo는 안 죽는다. 계획은 *세션 메모*가 아니라 **여기** 산다 — 다음 세션(누구든)이 읽고 잇는다. ccc-memory(project-committed > 세션 메모리) 자기 약 먹기(dogfood). *(2026-06-23 재설계 합의 · 2026-06-26 라이브 e2e 완료 반영.)*

## 한눈에 — 지금 어디

- **토대 + Maker 모델 + QA 라이브 e2e 완료.** `npm test` **green** · 워킹트리 clean.
- **라이브 e2e 증명됨 — 0→1 달성.** QA 11케이스 라이브 행사: **8 PASS**(case1·case2-fitting·case3a-foreign·case3b-idempotent·lc1·lc3·op1·rb2), xt1=크로스툴 코드생산 증명(codex 실발견·실행), lc2/rb1 데모. 라이브가 잡은 버그·공백은 영구 가드로 굳힘.
- **단 *가치(L4)*는 미증명.** *메커니즘*(컴파일·실행·크로스툴)은 증명됐지만 "하네스가 작업을 실제로 더 낫게 하나"의 통계적 증명은 아직(n=1). ← **진짜 다음 질문.**

## 정체성 (확정)

**AgentOppa = Maker.** 안 돌린다, **만든다.** 산출물 = 유저가 만드는 **재사용 Core(`.agentoppa/` 프레임워크) + Project(`.harness/` 구현·바인딩)** — 도구는 *가리켜서* 적재(`.claude`/`.codex` = 얇은 포인터). (모델 정정 상세: §다음 1.)
→ 개념 모델 상세는 **`ARCHITECTURE.md`**. 이 문서는 *현황·계획*만.

## 원칙·베팅 (확정)

- **런타임 엔진 안 둔다.** 단계 사이 상태 = 커밋된 문서 → resume·병렬·크로스툴 공짜. (loop/dynamic-workers 도 엔진 아닌 *컴파일된 self-gate 산문*으로.) *(ARCHITECTURE §3.)*
- **검사 러너는 허용** — 돌고 끝나는 validate. *상주 실행기*와 구분이 선.
- **기계가 읽는 데이터 → frontmatter**, 산문은 본문.
- **dogfood = `--plugin-dir`** (Codex는 `.agents/plugins/marketplace.json` 자동 감지). 행동 가드(always-on)는 `CLAUDE.md` import 로 플래그 없이도 로드.
- **크로스툴 동일 품질 · zero-dep** — 모든 부품이 Claude·Codex·어느 OS에서든. 헬퍼는 Node 빌트인.

## 지금까지 (완료)

**토대 · 레이아웃 · 모델 전환** *(~2026-06-25)*
- 검사 러너 `npm test`(red/green) · 죽은 `harness.yaml` 제거 · `ARCHITECTURE.md` 신설.
- SOURCE/COMPILED 레이아웃 · frontmatter 스키마화 · cookbook 제거 · Maker 모델(`agent-engineer`+`intent-interview`) 리프레임 · self-harden 개선 · validator 3종.

**QA 토대 + 라이브 e2e + 컴파일러 + 통일** *(2026-06-26)*
- **QA 토대**: 시드(시작상태) + 시나리오 러너 `qa/run.mjs` + 11케이스 + `plugins↛qa` 기계강제. 상세 `qa/README.md`.
- **첫 0→1 + 라이브 sweep**: 11케이스 라이브 행사 — 8 PASS, xt1 크로스툴 코드생산 증명(in-process 테스트로 codex 샌드박스 통과), lc2/rb1 데모.
- **phase→스킬 컴파일러 `plugins/agentoppa/bin/build-skills.mjs`**: 첫 라이브가 드러낸 *치명 부재*를 빌드 — slot 치환·Codex·agents·gate훅·core 단일소스·loop/dynamic-workers(self-gate 산문)·멱등. **golden 스냅샷 테스트**(`test/build-skills.test.mjs`)로 산출 가드.
- **레이아웃 통일**: 컴파일 산출 = `plugins/<harness>/` 공유트리 + 두 매니페스트 + 루트 마켓(= AgentOppa 자신과 같은 모델, codex 요구 충족). `.claude/.codex` 복제 폐기.
- **codex 0.140 실검증**: marketplace 스키마·레이아웃 불일치 2건 발견 → `ccc-plugin/validate` 가드 + 수정. codex 실발견 확인.
- **판정 기계화**: harness_present·project_unchanged·compiled_idempotent·acceptance·fits_existing_runner·foreign_harness_preserved·interview_gated·contract·intent_reflected·source_edits_preserved. (`resume_equivalent`만 수동.)
- **라이브 발견 가드**: build-agents 절대경로→basename(멱등·이식성) · config 인라인주석 파서 · loop inline 파서 · always-on 로드갭(CLAUDE.md import) · "작업 끝 체크리스트" 규칙. 전말 `.agentoppa/hardening-log.md`.

## 다음 (남은 일)

### 1. 재사용 Core 모델로 재설계  *(2026-06-27 합의 · 옛 "재사용 플러그인 빌드"를 정정·구체화)*

> **정정 배경:** 옛 모델은 Core=재사용 배관(validate.mjs)·워크플로우=프로젝트별 일회용(`project/phases/`)이라 유저 비전과 **반대**였다(워크플로우는 Core여야). 아래가 합의된 올바른 모델 — 위 "완료"의 Maker 모델·ARCHITECTURE·AGENTS는 이걸로 재작업된다(0단계).

**정체성:** Maker(이 repo)는 *아무것도 안 싣는다.* 유저가 Maker로 **자기만의 재사용 Core 프레임워크**를 만들어 여러 프로젝트에 *가리켜서* 쓴다.

**두 층(유저 프로젝트 안):**
- **Core** = 재사용 프레임워크 = `.agentoppa/`(자체완결 묶음: `.agents`+`.claude-plugin`+`plugins`, AgentOppa 자신과 같은 패키징 → github·복붙 이식). 워크플로우+범용 스킬+훅+**인터페이스(빈자리)**. **프로젝트 값을 안 박는다** → 그래서 재사용됨.
- **Project** = 구현·바인딩 = `.harness/`(intent + 어떤 Core + bindings + 구현 모듈).

**인터페이스↔구현:** Core 단계가 `requires:[e2e-runner]`(능력 빈자리) 선언 → Project가 `bindings:{e2e-runner: playwright}`+구현으로 채움 → Core 스킬은 그 값을 **런타임에 `.harness/`에서 읽음**(컴파일 때 안 박음) → validator가 미바인딩을 error.

**적재 = 가리키기(by-reference):** `.claude`/`.codex` = 얇은 포인터(Core 사본 없음). 메뉴 = `--plugin-dir` / marketplace install / 커밋 `.claude/settings.json`(Claude) · 루트 `.agents` 자동감지(Codex).

**Fallback+문서:** 생성 프로젝트의 `CLAUDE.md`/`AGENTS.md`가 Core *규칙*을 import → 플러그인 없이 떠도 행동 가드 생존(규칙만, 실행 부품 아님). `.agentoppa/README.md` = 연동 명령+폴더 목적+배포 옵션. (= 이 repo의 always-on 브리지 패턴을 생성물에도.)

**작업 분해(순서):**
0. **개념·불변식 재작성** — `ARCHITECTURE.md` §2(Core=프레임워크/Project=구현), `AGENTS.md`("콘텐츠 안 싣음" 유지 + "재사용 Core 워크플로우는 1급" 신설). *먼저.*
1. 인터페이스 스키마 — `agent-engineer/references/phases.md`에 `requires`/`bindings`, `recipe.md` config에 `core:`/`bindings:`.
2. Maker 스킬 두 모드 — agent-engineer: "Core 짓기" vs "프로젝트 바인딩"; intent-interview: 프레임워크 면담 분기.
3. 빌드 — `build-skills.mjs`: Core를 `.agentoppa/` 묶음으로 산출 + 런타임 읽기로 전환 + CLAUDE/AGENTS fallback 배선 + `.agentoppa/README.md` emit + 미바인딩 검사.
4. QA — "같은 Core, 두 구현(예: go test vs npm test) 주입" 케이스 = 비전 증명.

### 2. 가치(L4) 측정 — 메커니즘 너머
"하네스가 작업을 실제로 더 낫게/확실하게 하나"를 *측정*. baseline A/B(하네스 유/무 동일 작업) + 프로파일러 실측(🧠모델사고/🙋유저대기/⚙️하네스) 다회(n>1). 지금까진 메커니즘만 증명.

## 보류 (나중 재검토)
- **병렬**(git-workflow 프리셋) · **Mode B**(skillify — 쓸수록 학습) — 범위 밖.
- **`resume_equivalent` 기계화** — 중단본≡무중단본 2-run 동등성이라 단일 판정 불가(완결성은 contract+acceptance로 기계화됨). 케이스 재정의 시 부분 가능.
- **xt1 codex 전자동(소켓 하네스)** — 이 시드는 in-process 테스트로 해결. 소켓 쓰는 하네스는 codex 샌드박스 네트워크 허용 필요.
