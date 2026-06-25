#!/usr/bin/env node
// ccc-memory validator — AGENTS.md/CLAUDE.md/지식디렉토리를 이식성·예산 기준으로 점검한다.
// 사용법: node validate.mjs [AGENTS.md] [project-root]   (기본: ./AGENTS.md, .)
// 종료코드: 오류 0건이면 0, 있으면 1, 파일 없으면 2.
// 셸·coreutils 비의존(Node 빌트인만) → mac·linux·windows 동일 동작.
import { readFileSync, existsSync, readdirSync, lstatSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";

const c = { r: "\x1b[31m", y: "\x1b[33m", g: "\x1b[32m", d: "\x1b[2m", x: "\x1b[0m" };
let errors = 0, warns = 0;
const err = (m) => { console.log(`  ${c.r}✗${c.x} ${m}`); errors++; };
const warn = (m) => { console.log(`  ${c.y}⚠${c.x} ${m}`); warns++; };
const ok = (m) => { console.log(`  ${c.g}✓${c.x} ${m}`); };
const note = (m) => { console.log(`  ${c.d}· ${m}${c.x}`); };

const agentsPath = resolve(process.argv[2] ?? "AGENTS.md");
const root = resolve(process.argv[3] ?? ".");
console.log(`ccc-memory validate → ${relative(root, agentsPath) || agentsPath}`);

// --- memoryDir 설정 읽기 (단일 진실원천) ---
let memoryDir = ".agentoppa";
for (const cand of [".agentoppa", "_harness"]) {
  const cfg = join(root, cand, "config.json");
  if (existsSync(cfg)) {
    try { const j = JSON.parse(readFileSync(cfg, "utf8")); if (j.memoryDir) memoryDir = j.memoryDir; } catch { warn(`${cand}/config.json 파싱 실패`); }
    break;
  }
}
const memDirAbs = resolve(root, memoryDir);

// --- AGENTS.md 존재 + 예산 ---
if (!existsSync(agentsPath)) { err("AGENTS.md 없음 — 단일 소스가 있어야 함"); process.exit(2); }
const raw = readFileSync(agentsPath, "utf8");
const lines = raw.split(/\r?\n/);
const bytes = Buffer.byteLength(raw, "utf8");
const nLines = (raw.match(/\n/g) || []).length + 1;
ok("AGENTS.md 존재");
if (nLines <= 200) ok(`길이 ${nLines}줄 (≤200)`);
else warn(`길이 ${nLines}줄 (>200 — Claude 순응 저하. 긴 지식은 ${memoryDir}/로, 절차→스킬, 강제→훅)`);
if (bytes <= 32768) ok(`크기 ${bytes}B (≤32 KiB)`);
else err(`크기 ${bytes}B (>32 KiB — Codex가 한도 초과분을 드롭/잘림)`);

// --- 머신로컬 의존 감지 ---
const homeRefs = [...raw.matchAll(/@?~\/(?:\.claude|\.codex)[^\s)`]*/g)].map((m) => m[0]);
if (homeRefs.length) err(`머신로컬 참조 발견: ${[...new Set(homeRefs)].join(", ")} — project-committed로 옮길 것`);
else ok("머신로컬 참조 없음");

// --- @import 점검 (코드펜스 제외, resolve) ---
let inFence = false;
const imports = [];
for (const line of lines) {
  if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
  if (inFence) continue;
  const stripped = line.replace(/`[^`]*`/g, "");
  for (const m of stripped.matchAll(/(?:^|\s)@([^\s`)]+)/g)) imports.push(m[1]);
}
for (const imp of imports) {
  if (imp.startsWith("~/")) continue; // 머신로컬은 위에서 처리
  if (!existsSync(resolve(dirname(agentsPath), imp))) warn(`@import 대상 없음: ${imp}`);
}
if (imports.length) note(`@import ${imports.length}개 — launch에 인라인(상주)임을 기억: 비용 절감 아님`);

// --- CLAUDE.md 브리지 / drift ---
const claudePath = join(dirname(agentsPath), "CLAUDE.md");
if (existsSync(claudePath)) {
  let isSymlink = false;
  try { isSymlink = lstatSync(claudePath).isSymbolicLink(); } catch { /* noop */ }
  const cRaw = isSymlink ? "" : readFileSync(claudePath, "utf8");
  const bridges = isSymlink || /@AGENTS\.md/.test(cRaw);
  if (bridges) ok(`CLAUDE.md가 AGENTS.md를 브리지(${isSymlink ? "symlink" : "@import"})`);
  else err("CLAUDE.md가 AGENTS.md를 안 가리킴 — `@AGENTS.md`로 단일화(아니면 drift)");
  const body = cRaw.replace(/@AGENTS\.md/g, "").trim();
  if (bridges && !isSymlink && body.length > 600) warn(`CLAUDE.md 본문이 큼(${body.length}자) — AGENTS.md 복붙이면 drift. Claude 전용만 남길 것`);
} else {
  warn("CLAUDE.md 없음 — Claude는 AGENTS.md를 안 읽으므로 `@AGENTS.md` 브리지 권장");
}

// --- memoryDir: 존재 + 커밋(.gitignore 위반) ---
if (existsSync(memDirAbs)) {
  ok(`지식 디렉토리 ${memoryDir}/ 존재`);
  const gi = join(root, ".gitignore");
  if (existsSync(gi)) {
    const target = memoryDir.replace(/\/+$/, "");
    const ignored = readFileSync(gi, "utf8").split(/\r?\n/).some((l) => {
      const t = l.trim().replace(/^\//, "").replace(/\/+$/, "");
      return t && !t.startsWith("#") && (t === target || t === target + "/*");
    });
    if (ignored) err(`${memoryDir}/가 .gitignore됨 — 머신로컬과 같아짐. git 커밋해야 모든 머신 동일`);
    else ok(`${memoryDir}/ git 커밋 대상(gitignore 아님)`);
  }
} else {
  warn(`지식 디렉토리 ${memoryDir}/ 없음 — 긴 지식은 여기로(bare docs/ 금지)`);
}

// --- 조건부 포인터 resolve (memoryDir/*.md 언급이 실재하나) ---
const esc = memoryDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ptrs = [...new Set([...raw.matchAll(new RegExp(`${esc}/[\\w./-]+\\.md`, "g"))].map((m) => m[0]))];
let missingPtr = 0;
for (const p of ptrs) if (!existsSync(resolve(root, p))) { warn(`포인터 대상 없음: ${p}`); missingPtr++; }
if (ptrs.length && missingPtr === 0) ok(`조건부 포인터 ${ptrs.length}개 모두 실재`);

// --- (탈출구) .claude/rules/ paths glob 점검 ---
const rulesDir = join(root, ".claude", "rules");
if (existsSync(rulesDir)) {
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : (e.name.endsWith(".md") ? [join(d, e.name)] : []));
  for (const f of walk(rulesDir)) {
    const t = readFileSync(f, "utf8");
    if (!/^---/.test(t)) continue;
    const rest = t.split(/\r?\n/).slice(1);
    const end = rest.findIndex((l) => /^---\s*$/.test(l));
    const block = (end === -1 ? rest : rest.slice(0, end)).join("\n");
    if (/^paths\s*:/m.test(block)) ok(`rule ${relative(root, f)}: paths 스코프(Claude 지연로딩)`);
    else warn(`rule ${relative(root, f)}: paths 없음 → launch 상주(CLAUDE.md급). 의도한 건지 확인`);
  }
  note(".claude/rules/는 Claude 전용(탈출구). 이식엔 중첩 AGENTS.md/산문 조건 사용");
}

console.log(`result: ${errors} error(s), ${warns} warning(s)`);
process.exit(errors === 0 ? 0 : 1);
