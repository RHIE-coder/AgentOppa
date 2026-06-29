// board.mjs — 결정 보드 렌더러 테스트.
//   왜: board.mjs 는 면담·제안의 갈림길을 HTML 로 띄우는 헬퍼(zero-dep·크로스OS). 기능 회귀를 잡는다.
//   green = 유효 JSON → HTML 생성 + exit 0 (카드 내용이 실제로 렌더되는지) · red = 깨진 JSON → exit 1.
//   픽스처는 검사기가 훑는 plugins/ *밖*(.agentoppa/fixtures/)에 둬 repo 를 더럽히지 않는다.
// Node 빌트인만(zero-dep) → mac·linux·windows 동일.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const board = join(repoRoot, "plugins/agentoppa/bin/board.mjs");
const fx = join(repoRoot, ".agentoppa/fixtures/board");

// --no-open 으로 브라우저를 띄우지 않고 HTML 생성까지만 (CI·테스트 안전).
function run(input, extra = []) {
  const work = mkdtempSync(join(tmpdir(), "board-"));
  const out = join(work, "b.html");
  const r = spawnSync(process.execPath, [board, input, "--out", out, "--no-open", ...extra], { encoding: "utf8" });
  return { r, out };
}

test("board green — 유효 JSON 은 HTML 을 만들고 exit 0", () => {
  const { r, out } = run(join(fx, "green.json"));
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(out), "HTML 파일이 생성돼야");
  const html = readFileSync(out, "utf8");
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /플랫폼 짓고 키우기/, "카드 제목이 렌더돼야");
  assert.match(html, /class="facet"/, "행(facet)이 렌더돼야");
  assert.match(html, /class="flowbar"/, "flow 바가 렌더돼야");
});

test("board red — 깨진 JSON 은 exit 1", () => {
  const { r } = run(join(fx, "red.json"));
  assert.equal(r.status, 1, "깨진 JSON 은 파싱 실패로 exit 1 이어야");
});

test("board — 입력 인자 없으면 exit 2 (사용법)", () => {
  const r = spawnSync(process.execPath, [board, "--no-open"], { encoding: "utf8" });
  assert.equal(r.status, 2, "입력 경로 없으면 exit 2");
});
