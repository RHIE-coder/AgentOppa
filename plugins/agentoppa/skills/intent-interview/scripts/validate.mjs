#!/usr/bin/env node
// intent-interview validator — .harness/intent.md(의도 브리프)를 핸드오프 계약으로 점검.
// 사용법: node validate.mjs [path/to/intent.md]   (기본: .harness/intent.md)
// 종료코드: 오류 0건이면 0, 있으면 1, 파일 없으면 2.
// 셸·외부 의존 없음(Node 빌트인만) → mac·linux·windows 동일 동작.
import { readFileSync, existsSync } from "node:fs";

const c = { r: "\x1b[31m", y: "\x1b[33m", g: "\x1b[32m", x: "\x1b[0m" };
let errors = 0, warns = 0;
const err = (m) => { console.log(`  ${c.r}✗${c.x} ${m}`); errors++; };
const warn = (m) => { console.log(`  ${c.y}⚠${c.x} ${m}`); warns++; };
const ok = (m) => { console.log(`  ${c.g}✓${c.x} ${m}`); };

const file = process.argv[2] ?? ".harness/intent.md";
console.log(`intent-interview validate → ${file}`);
if (!existsSync(file)) { err("intent.md 없음"); process.exit(2); }

const raw = readFileSync(file, "utf8");
const lines = raw.split(/\r?\n/);

// --- 문서 머리말 추출 (contract §2) ---
let fm = "";
if (lines[0] !== "---") {
  err("머리말 없음 (1행이 '---' 여야 함)");
} else {
  const rest = lines.slice(1);
  const end = rest.findIndex((l) => /^---\s*$/.test(l));
  if (end === -1) err("헤더가 닫히지 않음 (두 번째 '---' 없음)");
  else { fm = rest.slice(0, end).join("\n"); ok("헤더 확인"); }
}
const get = (key) => {
  const line = fm.split("\n").find((l) => new RegExp(`^${key}:`).test(l));
  return line ? line.replace(new RegExp(`^${key}:\\s*`), "").replace(/\s*#.*$/, "").trim() : "";
};
const phase = get("phase");
const status = get("status");

if (phase === "intent-interview") ok(`phase=${phase}`);
else err(`phase '${phase || "(없음)"}' — 'intent-interview' 여야 함`);

if (["draft", "ready", "stale"].includes(status)) ok(`status=${status}`);
else err(`status '${status || "(없음)"}' — draft|ready|stale 중 하나여야 함`);

if (/^inputs:/m.test(fm)) ok("inputs 필드 있음");
else warn("inputs 필드 없음 (없으면 [] 로 명시)");

// --- 필수 섹션 (handoff.md 스키마의 ✓) ---
const required = ["목표", "범위", "제약", "우선순위", "미해결", "확신"];
for (const sec of required) {
  if (new RegExp(`^##\\s+${sec}(\\s.*)?$`, "m").test(raw)) ok(`섹션 '${sec}' 있음`);
  else err(`필수 섹션 '## ${sec}' 없음`);
}

// --- 확신 기록 여부: '## 확신' 아래에 판정이 적혀 있나 ---
const confIdx = lines.findIndex((l) => /^##\s+확신/.test(l));
if (confIdx !== -1) {
  const body = lines.slice(confIdx + 1, confIdx + 12).join("\n");
  if (/예|아니오|아니요/.test(body)) ok("확신 판정 기록됨");
  else warn("확신 섹션이 비어 보임 — 판정 4체크를 기록하라");
}

// --- 차단 미해결 ↔ status=ready 충돌 ('- 비차단:'은 제외) ---
let blockingOpen = false;
for (const l of lines) {
  if (!/^\s*-\s*차단:/.test(l)) continue;
  const v = l.replace(/^\s*-\s*차단:\s*/, "").trim();
  if (v && !/^없음|^none/i.test(v)) blockingOpen = true;
}
if (blockingOpen && status === "ready") err("차단 미해결이 남았는데 status=ready (draft 여야 함)");
else if (blockingOpen) ok("차단 미해결 있음 → status=draft (정상)");
else ok("차단 미해결 없음");

console.log(`result: ${errors} error(s), ${warns} warning(s)`);
process.exit(errors === 0 ? 0 : 1);
