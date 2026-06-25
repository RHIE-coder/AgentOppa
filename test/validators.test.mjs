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
    name: "agent-engineer/config — phase 연결(dangling) 점검",
    validator: "plugins/agentoppa/skills/agent-engineer/scripts/validate.mjs",
    red: ".agentoppa/fixtures/agent-engineer-config/red/.harness/config.yaml",
    green: ".agentoppa/fixtures/agent-engineer-config/green/.harness/config.yaml",
  },
  {
    name: "intent-interview — 차단 미해결인데 status=ready 점검",
    validator: "plugins/agentoppa/skills/intent-interview/scripts/validate.mjs",
    red: ".agentoppa/fixtures/intent-interview/red/.harness/intent.md",
    green: ".agentoppa/fixtures/intent-interview/green/.harness/intent.md",
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
