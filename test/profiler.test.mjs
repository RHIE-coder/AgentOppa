// harness 프로파일러(정적 반쪽) 검사 — green fixture 의 실제 .harness/ 를 물려
//   ① JSON(데이터)  ② HTML(self-contained 뷰 · JSON 내장)  ③ 콘솔(텍스트) 세 산출이
//   흐름·차단게이트·동적워커·비용을 제대로 담는지 확인. (validator red/green 과 달리 내용 단언.)
// Node 빌트인만(zero-dep) → mac·linux·windows 동일.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { readFileSync, rmSync, mkdtempSync } from "node:fs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const abs = (p) => join(repoRoot, p);
const PROFILER = abs("plugins/agentoppa/bin/profile-harness.mjs");
const GREEN = abs(".agentoppa/fixtures/agent-engineer-config/green/.harness/config.yaml");

test("profiler — green fixture: JSON 데이터 + HTML 뷰 + 콘솔로 흐름·게이트·비용을 낸다", () => {
  const dir = mkdtempSync(join(tmpdir(), "agentoppa-profile-"));
  const r = spawnSync(process.execPath, [PROFILER, GREEN, "--out-dir", dir], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(r.status, 0, `프로파일러 실패(exit ${r.status})\n${r.stderr}`);

  // ① JSON = canonical 데이터 — 파싱되고 구조가 맞아야
  const data = JSON.parse(readFileSync(join(dir, "analyzed.json"), "utf8"));
  assert.equal(data.advisory, true, "참고용 플래그 누락");
  assert.equal(data.half, "static", "정적 반쪽 표시 누락");
  assert.equal(data.harness, "demo-flow");
  assert.deepEqual(data.phases.map((p) => p.name), ["spec", "tdd", "review"], "흐름 순서");
  const review = data.phases.find((p) => p.name === "review");
  assert.equal(review.sync, "strict", "review sync=strict 미반영");
  assert.equal(review.blocking, true, "review 차단 게이트 미반영");
  assert.ok(review.workers && review.workers.options.includes("code-reviewer"), "동적 워커 미반영");
  assert.equal(data.cost.baseHp, 6, "비용 합계(hp 6) 어긋남");
  assert.equal(data.counts.strictGates, 1, "strict 게이트 카운트");

  // ② HTML = self-contained 뷰 — 같은 JSON 을 내장(data island)하고 서버사이드 렌더
  const html = readFileSync(join(dir, "analyzed.html"), "utf8");
  assert.match(html, /<!doctype html>/i, "HTML 문서 아님");
  assert.match(html, /id="harness-profile"/, "JSON 데이터 island 누락(파일://에서 fetch 없이 열리는 핵심)");
  assert.match(html, /code-reviewer/, "HTML 렌더에 동적 워커 누락");
  assert.match(html, /🚧 차단/, "HTML 렌더에 차단 게이트 누락");
  assert.match(html, /참고용/, "HTML 참고용 표기 누락");
  assert.doesNotMatch(html, /<\/script>\s*<script type="application\/json"/, "data island 이 조기 종료됨(이스케이프 실패)");

  // ③ 콘솔(stdout) 텍스트
  assert.match(r.stdout, /harness 프로파일/, "콘솔 출력 누락");
  assert.match(r.stdout, /base 합계: hp 6/, "콘솔 비용 합계 누락");

  rmSync(dir, { recursive: true, force: true });
});

test("profiler — config 없으면 종료코드 2", () => {
  const r = spawnSync(process.execPath, [PROFILER, abs("nope/.harness/config.yaml"), "--no-write"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(r.status, 2, `config 없을 때 exit 2 여야 (got ${r.status})`);
});
