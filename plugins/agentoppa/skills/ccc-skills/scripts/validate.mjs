#!/usr/bin/env node
// ccc-skills validator — SKILL.md를 Claude + Codex 공통 체크리스트로 점검한다.
// 사용법: node validate.mjs [path/to/SKILL.md]   (기본: ./SKILL.md)
// 종료코드: 오류 0건이면 0, 있으면 1, 파일 없으면 2.
// 셸·coreutils 비의존(Node 빌트인만) → mac·linux·windows 동일 동작.
import { readFileSync, existsSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

const c = { r: "\x1b[31m", y: "\x1b[33m", g: "\x1b[32m", x: "\x1b[0m" };
let errors = 0;
let warns = 0;
const err = (m) => { console.log(`  ${c.r}✗${c.x} ${m}`); errors++; };
const warn = (m) => { console.log(`  ${c.y}⚠${c.x} ${m}`); warns++; };
const ok = (m) => { console.log(`  ${c.g}✓${c.x} ${m}`); };

const file = process.argv[2] ?? "SKILL.md";
console.log(`ccc-skills validate → ${file}`);
if (!existsSync(file)) { err("파일을 찾을 수 없음"); process.exit(2); }

const raw = readFileSync(file, "utf8");
const lines = raw.split(/\r?\n/);

// --- frontmatter: 1행이 '---'여야 하고, 다음 '---'까지를 추출 ---
let fm = "";
if (lines[0] !== "---") {
  err("YAML frontmatter 없음 (1행이 '---' 여야 함)");
} else {
  ok("frontmatter 시작 확인");
  const rest = lines.slice(1);
  const end = rest.findIndex((l) => /^---\s*$/.test(l));
  fm = (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

// 필드 추출 (첫 매치, 'key:' 접두사 제거)
const get = (key) => {
  const line = fm.split("\n").find((l) => new RegExp(`^${key}:`).test(l));
  return line ? line.replace(new RegExp(`^${key}:\\s*`), "") : "";
};
const name = get("name");
const desc = get("description");

// --- name: Claude는 선택(디렉토리명 폴백), Codex는 필수. 있으면 형식 검사 ---
if (name) {
  if (/^[a-z0-9-]+$/.test(name)) ok(`name '${name}' 형식 ok`);
  else err(`name '${name}' — 소문자/숫자/하이픈만 허용`);
  const dir = basename(resolve(dirname(file)));
  if (name !== dir) warn(`name '${name}' != 디렉토리 '${dir}' (Claude는 디렉토리명을 명령어로 씀)`);
} else {
  warn("name 없음 (Claude는 디렉토리명으로 폴백; Codex는 필수)");
}

// --- description: 가장 중요 ---
if (desc) {
  ok("description 있음");
  const len = desc.length;
  if (len <= 1536) ok(`description ${len}자 (≤1536)`);
  else warn(`description ${len}자 (>1536 — 목록에서 잘림)`);
  if (/→|->|단계|[0-9]\)|, then |then ,/.test(desc))
    warn("description이 워크플로를 요약하는 듯 — '언제 쓰는가'만 남기고 절차는 본문으로");
} else {
  err("description 없음 (가장 중요한 필드)");
}

// --- 본문 길이: ≤500줄 권장 (wc -l 과 동일하게 개행 수로 센다) ---
const total = (raw.match(/\n/g) || []).length;
if (total <= 500) ok(`길이 ${total}줄 (≤500)`);
else warn(`길이 ${total}줄 (>500 — 상세는 references/로)`);

// --- 마크다운 링크가 가리키는 로컬 파일 실재 확인 ---
// 펜스 코드블록(```)과 인라인 코드(`...`)는 예시이므로 제외한다.
const base = resolve(dirname(file));
let missing = 0;
let inFence = false;
const refs = [];
for (const line of lines) {
  if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
  if (inFence) continue;
  const stripped = line.replace(/`[^`]*`/g, "");
  for (const m of stripped.matchAll(/\]\(([^)]+)\)/g)) refs.push(m[1]);
}
for (const ref of refs) {
  if (/^https?/.test(ref) || ref.startsWith("#") || ref.startsWith("$") || ref === "" || /<.*>/.test(ref))
    continue;
  if (!existsSync(resolve(base, ref))) { warn(`참조 파일 없음: ${ref}`); missing++; }
}
if (missing === 0) ok("참조 파일 모두 존재");

console.log(`result: ${errors} error(s), ${warns} warning(s)`);
process.exit(errors === 0 ? 0 : 1);
