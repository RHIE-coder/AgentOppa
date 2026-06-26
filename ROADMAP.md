# AgentOppa ROADMAP

> 세션은 죽어도 repo는 안 죽는다. 계획은 *세션 메모*가 아니라 **여기** 산다 — 다음 세션(누구든)이 읽고 잇는다. ccc-memory(project-committed > 세션 메모리) 자기 약 먹기(dogfood). *(2026-06-23 재설계 합의 · 2026-06-26 라이브 e2e 완료 반영.)*

## 한눈에 — 지금 어디

- **토대 + Maker 모델 + QA 라이브 e2e 완료.** `npm test` **green** · 워킹트리 clean.
- **라이브 e2e 증명됨 — 0→1 달성.** QA 11케이스 라이브 행사: **8 PASS**(case1·case2-fitting·case3a-foreign·case3b-idempotent·lc1·lc3·op1·rb2), xt1=크로스툴 코드생산 증명(codex 실발견·실행), lc2/rb1 데모. 라이브가 잡은 버그·공백은 영구 가드로 굳힘.
- **단 *가치(L4)*는 미증명.** *메커니즘*(컴파일·실행·크로스툴)은 증명됐지만 "하네스가 작업을 실제로 더 낫게 하나"의 통계적 증명은 아직(n=1). ← **진짜 다음 질문.**

## 정체성 (확정)

**AgentOppa = Maker.** 안 돌린다, **만든다.** 산출물 = **Core Layer + Project Layer + Config** (SOURCE `.harness/` → COMPILED `plugins/<harness>/` 공유트리 + 루트 마켓).
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

### 1. 재사용 플러그인 빌드  (target 무관)
Core Layer(프로젝트 무관 재사용 배관)를 독립 플러그인으로 빌드·산출. 라이브 e2e 완료로 선행조건 다 풀림.

### 2. 가치(L4) 측정 — 메커니즘 너머
"하네스가 작업을 실제로 더 낫게/확실하게 하나"를 *측정*. baseline A/B(하네스 유/무 동일 작업) + 프로파일러 실측(🧠모델사고/🙋유저대기/⚙️하네스) 다회(n>1). 지금까진 메커니즘만 증명.

## 보류 (나중 재검토)
- **병렬**(git-workflow 프리셋) · **Mode B**(skillify — 쓸수록 학습) — 범위 밖.
- **`resume_equivalent` 기계화** — 중단본≡무중단본 2-run 동등성이라 단일 판정 불가(완결성은 contract+acceptance로 기계화됨). 케이스 재정의 시 부분 가능.
- **xt1 codex 전자동(소켓 하네스)** — 이 시드는 in-process 테스트로 해결. 소켓 쓰는 하네스는 codex 샌드박스 네트워크 허용 필요.
