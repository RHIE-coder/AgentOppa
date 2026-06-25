#!/usr/bin/env node
// ccc-agents validator — 서브에이전트 .md(단일 소스)를 Claude + Codex 공통 + 이식성으로 점검한다.
// 사용법: node validate.mjs [path/to/agent.md]   (기본: ./agent.md)
// 종료코드: 오류 0건이면 0, 있으면 1, 파일 없으면 2.
// 셸·coreutils 비의존(Node 빌트인만) → mac·linux·windows 동일 동작.
import { readFileSync, existsSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

const c = { r: "\x1b[31m", y: "\x1b[33m", g: "\x1b[32m", x: "\x1b[0m" };
let errors = 0, warns = 0;
const err = (m) => { console.log(`  ${c.r}✗${c.x} ${m}`); errors++; };
const warn = (m) => { console.log(`  ${c.y}⚠${c.x} ${m}`); warns++; };
const ok = (m) => { console.log(`  ${c.g}✓${c.x} ${m}`); };

const file = process.argv[2] ?? "agent.md";
console.log(`ccc-agents validate → ${file}`);
if (!existsSync(file)) { err("파일을 찾을 수 없음"); process.exit(2); }

const raw = readFileSync(file, "utf8");
const lines = raw.split(/\r?\n/);

// --- frontmatter: 1행 '---' ~ 다음 '---', 본문은 그 이후 ---
if (lines[0] !== "---") err("YAML frontmatter 없음 (1행이 '---' 여야 함)");
else ok("frontmatter 시작 확인");
const endRel = lines.slice(1).findIndex((l) => /^---\s*$/.test(l));
const fm = endRel === -1 ? lines.slice(1) : lines.slice(1, endRel + 1);
const body = (endRel === -1 ? "" : lines.slice(endRel + 2).join("\n")).trim();
const has = (k) => fm.some((l) => new RegExp(`^${k}:`).test(l));
const get = (k) => {
  const l = fm.find((x) => new RegExp(`^${k}:`).test(x));
  return l ? l.replace(new RegExp(`^${k}:\\s*`), "").replace(/^["']|["']$/g, "").trim() : "";
};

// --- name: 형식 + 파일명 일치 권장 ---
const name = get("name");
if (name) {
  if (/^[a-z0-9-]+$/.test(name)) ok(`name '${name}' 형식 ok`);
  else err(`name '${name}' — 소문자/숫자/하이픈만 허용`);
  const fn = basename(file, ".md");
  if (name !== fn) warn(`name '${name}' != 파일명 '${fn}' (맞추길 권장)`);
} else {
  warn("name 없음 (생성 시 .md 파일명으로 폴백)");
}

// --- description: 위임/선택의 근거 ---
const desc = get("description");
if (desc) {
  ok("description 있음");
  if (/→|->|단계|[0-9]\)|, then |then ,/.test(desc))
    warn("description이 절차를 요약하는 듯 — '언제 위임/선택하나'만 남긴다");
} else {
  err("description 없음 (위임 판단/선택의 근거 — 양쪽 필수)");
}

// --- 본문 = 시스템 프롬프트 → Codex developer_instructions 필수 ---
if (body) ok(`본문(시스템 프롬프트) ${body.split(/\n/).length}줄`);
else err("본문 비어 있음 — Codex developer_instructions로 필수");

// --- 능력 범위: access 우선, 없으면 tools 추론 ---
const access = get("access");
const tools = get("tools");
if (access) {
  if (["read-only", "read-write"].includes(access)) ok(`access '${access}' → Codex sandbox_mode`);
  else warn(`access '${access}' — read-only|read-write 권장`);
} else if (tools) {
  const ro = !/\b(Edit|Write|NotebookEdit|MultiEdit)\b/.test(tools);
  ok(`access 미지정 → tools에서 ${ro ? "read-only" : "read-write"} 추론`);
} else {
  warn("access·tools 둘 다 없음 → Codex sandbox_mode 상속(범위 미통제)");
}

// --- 이식성: Claude 전용 필드 / 번역 안 되는 모델명 ---
const CLAUDE_ONLY = ["permissionMode", "maxTurns", "skills", "mcpServers", "hooks",
  "memory", "background", "isolation", "color", "initialPrompt", "disallowedTools"];
const present = CLAUDE_ONLY.filter((k) => has(k));
if (present.length) warn(`Claude 전용 필드(생성 .toml에서 드롭): ${present.join(", ")}`);
const model = get("model");
if (model && /^(sonnet|opus|haiku|fable|claude-|inherit)/.test(model) && !get("codex-model"))
  warn(`model '${model}'은 Codex로 번역 안 됨 → 세션 상속 (명시하려면 codex-model:)`);

// --- 참조 링크 실재 (펜스·인라인 코드 제외) ---
const base = resolve(dirname(file));
let inFence = false, missing = 0;
for (const line of lines) {
  if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
  if (inFence) continue;
  for (const m of line.replace(/`[^`]*`/g, "").matchAll(/\]\(([^)]+)\)/g)) {
    const ref = m[1];
    if (/^https?/.test(ref) || ref.startsWith("#") || ref.startsWith("$") || ref === "" || /<.*>/.test(ref)) continue;
    if (!existsSync(resolve(base, ref))) { warn(`참조 파일 없음: ${ref}`); missing++; }
  }
}
if (missing === 0) ok("참조 링크 모두 존재");

console.log(`result: ${errors} error(s), ${warns} warning(s)`);
process.exit(errors === 0 ? 0 : 1);
