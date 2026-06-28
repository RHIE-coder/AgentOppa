// AgentOppa 결정적 검사 러너 — validator를 red/green fixture에 물려 자동 검사.
// 실행: node --test test/   (또는 npm test)
//   red   = 반칙 입력  → validator가 실패(exit≠0)해야 정상.
//   green = 정상 입력  → validator가 통과(exit 0)해야 정상.
// Node 빌트인만(zero-dep) → mac·linux·windows 동일.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const abs = (p) => join(repoRoot, p);

// 새 규칙을 박을 때마다 여기에 한 줄씩 추가한다 (self-harden 패턴: validator + red/green).
const CASES = [
  {
    name: "ccc-plugin/coupling — 스킬이 다른 스킬의 examples 링크 금지",
    validator: "plugins/agentoppa/skills/ccc-plugin/scripts/validate.mjs",
    red: ".agentoppa/fixtures/ccc-plugin-coupling/red",
    green: ".agentoppa/fixtures/ccc-plugin-coupling/green",
  },
  {
    // 라이브 e2e 발견 버그 가드: codex 0.140 마켓 스키마. Claude식 owner(name 누락)·
    // 무효 policy enum("explicit"/"none")을 codex 가 거부 → validator 가 기계로 잡는다.
    name: "ccc-plugin/codex-schema — codex 마켓 name(owner아님)·policy enum 점검",
    validator: "plugins/agentoppa/skills/ccc-plugin/scripts/validate.mjs",
    red: ".agentoppa/fixtures/ccc-plugin-codex-schema/red",
    green: ".agentoppa/fixtures/ccc-plugin-codex-schema/green",
  },
  {
    name: "agent-engineer/config — phase 연결(dangling) 점검",
    validator: "plugins/agentoppa/skills/agent-engineer/scripts/validate.mjs",
    red: ".agentoppa/fixtures/agent-engineer-config/red/.harness/config.yaml",
    green: ".agentoppa/fixtures/agent-engineer-config/green/.harness/config.yaml",
  },
  {
    // 라이브 e2e 회귀 가드: phases:/values: 줄의 인라인 주석(`phases:  # ...`)에
    // 블록이 조용히 무시돼 거짓 "phases 비었음"을 내던 파서 버그.
    // green = 인라인 주석 달린 *유효한* config → 통과해야(수정 전엔 거짓 실패).
    // red   = 주석은 정상 파싱되지만 내용이 진짜 dangling → 실패해야.
    name: "agent-engineer/config — phases·values 인라인 주석 허용(파서 회귀)",
    validator: "plugins/agentoppa/skills/agent-engineer/scripts/validate.mjs",
    red: ".agentoppa/fixtures/agent-engineer-inline-comment/red/.harness/config.yaml",
    green: ".agentoppa/fixtures/agent-engineer-inline-comment/green/.harness/config.yaml",
  },
  {
    // 인터페이스 계약: requires 능력-빈자리 ↔ config.bindings/impl.
    // green = 능력이 전부 bindings+impl 로 덮임(선택 능력은 미바인딩이어도 통과).
    // red   = 능력 하나 미바인딩 → error 여야(ARCHITECTURE §31 미바인딩=error).
    name: "agent-engineer/bindings — requires 능력-빈자리 미바인딩 점검",
    validator: "plugins/agentoppa/skills/agent-engineer/scripts/validate.mjs",
    red: ".agentoppa/fixtures/agent-engineer-bindings/red/.harness/config.yaml",
    green: ".agentoppa/fixtures/agent-engineer-bindings/green/.harness/config.yaml",
  },
  {
    // 줄단위 config 파서가 블록 스칼라(|·>)를 조용히 먹는 걸 error 로 막는다(미지원 문법 사전 차단).
    // red = values 에 블록 스칼라 → error · green = 같은 값을 한 줄로 → 통과.
    name: "agent-engineer/parser — 미지원 블록 스칼라(|·>) 조용한 누락 차단",
    validator: "plugins/agentoppa/skills/agent-engineer/scripts/validate.mjs",
    red: ".agentoppa/fixtures/agent-engineer-blockscalar/red/.harness/config.yaml",
    green: ".agentoppa/fixtures/agent-engineer-blockscalar/green/.harness/config.yaml",
  },
  {
    name: "intent-interview — 차단 미해결인데 status=ready 점검",
    validator: "plugins/agentoppa/skills/intent-interview/scripts/validate.mjs",
    red: ".agentoppa/fixtures/intent-interview/red/.harness/intent.md",
    green: ".agentoppa/fixtures/intent-interview/green/.harness/intent.md",
  },
  {
    name: "check-doc-refs — 커밋 문서의 dangling 상대링크 점검",
    validator: "plugins/agentoppa/bin/check-doc-refs.mjs",
    red: ".agentoppa/fixtures/doc-refs/red",
    green: ".agentoppa/fixtures/doc-refs/green",
  },
  {
    // qa JUDGE 'fits_existing_runner' 판정 로직(lib/fits-runner) 의 red/green.
    // 엔진(plugins) 아닌 qa 자체 검증기라 한방향 의존 위반 아님(qa→qa).
    name: "qa/fits-runner — 기존 러너 재사용(새 devDep·테스트설정 0, scripts.test 불변)",
    validator: "qa/checks/fits-runner.mjs",
    red: ".agentoppa/fixtures/fits-runner/red",
    green: ".agentoppa/fixtures/fits-runner/green",
  },
  {
    // qa JUDGE 'contract' 판정 로직(lib/contract) 의 red/green — 산출물 헤더·연결.
    name: "qa/contract — 산출물 헤더(§2)·연결(§4) 점검",
    validator: "qa/checks/contract.mjs",
    red: ".agentoppa/fixtures/contract/red",
    green: ".agentoppa/fixtures/contract/green",
  },
  {
    name: "check-no-qa-ref — 엔진(plugins)의 disposable(qa) 참조 금지",
    validator: "plugins/agentoppa/bin/check-no-qa-ref.mjs",
    red: ".agentoppa/fixtures/no-qa-ref/red",
    green: ".agentoppa/fixtures/no-qa-ref/green",
  },
  {
    // always-on 이 금지 예시로 등재한 조어를 커밋 문서 본문이 쓰면 실패.
    // 금지어는 fixture 안 always-on.md 에서 추출(단일소스) → red 의 doc.md 가 그 조어를 써서 실패해야.
    name: "check-banned-terms — always-on 등재 금지 조어를 문서가 쓰면 실패",
    validator: "plugins/agentoppa/bin/check-banned-terms.mjs",
    red: ".agentoppa/fixtures/banned-terms/red",
    green: ".agentoppa/fixtures/banned-terms/green",
  },
  {
    // parseConfig 동치: build-skills ↔ validate 가 같은 config 에 같은 결과를 내야(아니면 빌드/검증 해석 갈림).
    // green = 두 mjs 의 parseConfig 동작 동일 · red = phase 처리가 달라 drift → 검사기가 불일치를 잡아야.
    name: "check-parseconfig-parity — 두 parseConfig 동작 drift 검출",
    validator: "plugins/agentoppa/bin/check-parseconfig-parity.mjs",
    red: ".agentoppa/fixtures/parseconfig-parity/red",
    green: ".agentoppa/fixtures/parseconfig-parity/green",
  },
  {
    // resume_equivalent: 중단→재개 산출이 무중단 산출과 *구조 동등*(역할 집합·순서·유효 헤더)인가.
    // green = 두 세트 역할·순서 동일(내용 문장은 달라도 OK) · red = 재개본이 한 단계(impl) 누락 → 비동등.
    name: "qa/resume — 중단본 vs 무중단본 산출 구조 동등(resume_equivalent)",
    validator: "qa/checks/resume.mjs",
    red: ".agentoppa/fixtures/resume-equivalent/red",
    green: ".agentoppa/fixtures/resume-equivalent/green",
  },
];

function run(validator, target) {
  return spawnSync(process.execPath, [abs(validator), abs(target)], {
    cwd: repoRoot,
    encoding: "utf8",
  });
}

for (const c of CASES) {
  test(`${c.name} → red 는 실패해야`, () => {
    const r = run(c.validator, c.red);
    assert.notEqual(
      r.status,
      0,
      `red fixture가 통과해버림(exit ${r.status}) — validator가 반칙을 못 잡음\n${r.stdout}`,
    );
  });

  test(`${c.name} → green 은 통과해야`, () => {
    const r = run(c.validator, c.green);
    assert.equal(
      r.status,
      0,
      `green fixture가 실패함(exit ${r.status}) — validator 오작동(멀쩡한 걸 막음)\n${r.stdout}`,
    );
  });
}

// --- 자기 점검: 우리 자신의 커밋 문서는 dangling 상대링크가 0이어야 (검사기가 실제로 repo를 지키게) ---
//     fixtures/ 는 의도적 반칙 입력이라 제외 — 그건 위 red/green CASE로 따로 검증한다.
const SELF_CHECK = ["plugins", "README.md", "ARCHITECTURE.md", "AGENTS.md", "CLAUDE.md"];
for (const tgt of SELF_CHECK) {
  test(`check-doc-refs 자기점검 — ${tgt} 의 dangling 상대링크는 0`, () => {
    const r = run("plugins/agentoppa/bin/check-doc-refs.mjs", tgt);
    assert.equal(
      r.status,
      0,
      `${tgt} 에 dangling 상대링크 있음 — 대상 파일을 만들거나 참조를 고칠 것(참조 0까지)\n${r.stdout}`,
    );
  });
}

// --- 자기 점검: 엔진(plugins/)은 disposable 한 qa 트리를 절대 참조하지 않는다(한방향 의존) ---
//     불변식 "core/engine ↛ disposable 콘텐츠" 의 기계 강제. qa/ 를 통째로 빼도 프레임워크는 멀쩡해야 함.
test("check-no-qa-ref 자기점검 — plugins 는 qa 참조 0 (한방향)", () => {
  const r = run("plugins/agentoppa/bin/check-no-qa-ref.mjs", "plugins");
  assert.equal(
    r.status,
    0,
    `plugins(엔진) 가 disposable qa 트리를 참조함 — 엔진은 disposable 에 의존 금지\n${r.stdout}`,
  );
});

// --- 자기 점검: always-on 이 금지 예시로 등재한 조어를 우리 커밋 문서가 본문에 쓰지 않는다 ---
//     "쉬운 말로 쓴다(지어낸 말 금지)" 의 기계 조각. always-on.md 에서 금지어를 뽑아 repo 문서를 훑는다.
//     검사기가 .agentoppa/qa/node_modules/.git 는 건너뜀 → fixtures 의 의도적 위반은 self-check 에서 제외.
test("check-banned-terms 자기점검 — repo 문서에 금지 조어 0", () => {
  const r = run("plugins/agentoppa/bin/check-banned-terms.mjs", ".");
  assert.equal(
    r.status,
    0,
    `커밋 문서에 always-on 등재 금지 조어가 있음 — 쉬운 말로 바꿀 것(검사기가 가리킨 파일:줄)\n${r.stdout}`,
  );
});

// --- 자기 점검: 실제 build-skills ↔ validate 의 parseConfig 가 동작 동치 (인자 없이 = 두 실제 파일 대조) ---
//     copyFileSync 배포라 코드 단일소스화는 불가 → 동작 동치를 검사기로 강제(drift 시 빌드/검증 해석이 갈림).
test("check-parseconfig-parity 자기점검 — build-skills ↔ validate parseConfig 동치", () => {
  const r = spawnSync(process.execPath, [abs("plugins/agentoppa/bin/check-parseconfig-parity.mjs")], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(
    r.status,
    0,
    `build-skills 와 validate 의 parseConfig 동작이 갈림(drift) — clean/splitList/파서를 맞출 것\n${r.stdout}`,
  );
});
