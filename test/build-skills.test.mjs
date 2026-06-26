// build-skills 골든 스냅샷 테스트 — 컴파일러의 *산출 내용*(SKILL.md)이 고정 스냅샷과 일치하는지.
//   왜: validator red/green 은 pass/fail 만 본다 → 슬롯 치환·self-gate·헤더 같은 *컴파일 산출 내용*의
//        회귀는 못 잡는다. 이 골든이 그 빈틈을 메운다(라이브 e2e 후속 가드).
//   입력  = .agentoppa/fixtures/build-skills/input/.harness/  (spec→impl→test)
//   골든  = .agentoppa/fixtures/build-skills/golden/skills/<name>/SKILL.md
//   의도된 컴파일러 변경이면 golden 을 재생성한다(README/주석 참조).
// Node 빌트인만(zero-dep) → mac·linux·windows 동일.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const fx = join(repoRoot, ".agentoppa/fixtures/build-skills");
const buildSkills = join(repoRoot, "plugins/agentoppa/bin/build-skills.mjs");

function compileInTemp(prefix) {
  const work = mkdtempSync(join(tmpdir(), prefix));
  cpSync(join(fx, "input/.harness"), join(work, ".harness"), { recursive: true });
  const r = spawnSync(process.execPath, [buildSkills, work], { encoding: "utf8" });
  return { work, r };
}

test("build-skills golden — 컴파일 SKILL.md 가 스냅샷과 일치", () => {
  const { work, r } = compileInTemp("bs-golden-");
  try {
    assert.equal(r.status, 0, `build-skills 실패(exit ${r.status})\n${r.stdout}${r.stderr}`);
    const goldSkills = join(fx, "golden/skills");
    const names = readdirSync(goldSkills);
    assert.ok(names.length > 0, "golden skills 비어 있음");
    for (const name of names) {
      const got = join(work, "plugins/demo/skills", name, "SKILL.md");
      assert.ok(existsSync(got), `컴파일 산출 누락: skills/${name}/SKILL.md`);
      assert.equal(
        readFileSync(got, "utf8"),
        readFileSync(join(goldSkills, name, "SKILL.md"), "utf8"),
        `skills/${name}/SKILL.md 가 golden 과 다름 — 컴파일러 산출 회귀? (의도된 변경이면 golden 재생성)`,
      );
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("build-skills 멱등 — 재컴파일해도 SKILL.md 불변", () => {
  const { work } = compileInTemp("bs-idem-");
  try {
    const skill = join(work, "plugins/demo/skills/spec/SKILL.md");
    const first = readFileSync(skill, "utf8");
    spawnSync(process.execPath, [buildSkills, work], { encoding: "utf8" });
    assert.equal(readFileSync(skill, "utf8"), first, "재컴파일이 SKILL.md 를 바꿈(비멱등)");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
