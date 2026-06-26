#!/usr/bin/env node
// ccc-plugin validator — 두 매니페스트(.claude-plugin/.codex-plugin)·마켓플레이스·호스트 결합을 점검한다.
// 사용법: node validate.mjs [plugin-dir]   (기본: .)  — repo 루트는 walk-up으로 탐지
// 종료코드: 오류 0건이면 0, 있으면 1.
// 셸·coreutils 비의존(Node 빌트인만) → mac·linux·windows 동일 동작.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join, dirname, relative } from "node:path";

const c = { r: "\x1b[31m", y: "\x1b[33m", g: "\x1b[32m", d: "\x1b[2m", x: "\x1b[0m" };
let errors = 0, warns = 0;
const err = (m) => { console.log(`  ${c.r}✗${c.x} ${m}`); errors++; };
const warn = (m) => { console.log(`  ${c.y}⚠${c.x} ${m}`); warns++; };
const ok = (m) => { console.log(`  ${c.g}✓${c.x} ${m}`); };
const note = (m) => { console.log(`  ${c.d}· ${m}${c.x}`); };
const readJSON = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch (e) { err(`${p} JSON 파싱 실패: ${e.message}`); return null; } };

const pluginDir = resolve(process.argv[2] ?? ".");
console.log(`ccc-plugin validate → ${pluginDir}`);

const cPath = join(pluginDir, ".claude-plugin", "plugin.json");
const xPath = join(pluginDir, ".codex-plugin", "plugin.json");
const hasC = existsSync(cPath), hasX = existsSync(xPath);

// --- 두 매니페스트 다 존재? ---
if (hasC && hasX) ok("두 매니페스트 존재 (.claude-plugin + .codex-plugin)");
else if (hasC && !hasX) err(".codex-plugin/plugin.json 없음 — Codex에 안 실림(절반 배포)");
else if (!hasC && hasX) err(".claude-plugin/plugin.json 없음 — Claude에 안 실림(절반 배포)");
else { err("두 매니페스트 모두 없음 — 여기가 플러그인 루트가 맞는가?"); process.exit(1); }

const cm = hasC ? readJSON(cPath) : null;
const xm = hasX ? readJSON(xPath) : null;

// --- name 필수 + 일치 ---
if (cm && !cm.name) err(".claude-plugin: name 없음(필수)");
if (xm && !xm.name) err(".codex-plugin: name 없음(필수)");
if (cm?.name && xm?.name) {
  if (cm.name === xm.name) ok(`name 일치 ('${cm.name}')`);
  else err(`name 드리프트: claude '${cm.name}' ≠ codex '${xm.name}'`);
}

// --- version/description 일치 + 채움 ---
for (const key of ["version", "description"]) {
  const cv = cm?.[key], xv = xm?.[key];
  if (cv !== undefined && xv !== undefined && cv !== xv) warn(`${key} 드리프트: claude '${cv}' ≠ codex '${xv}'`);
}
for (const [m, who] of [[cm, "claude"], [xm, "codex"]]) {
  if (!m) continue;
  if (!m.description) warn(`${who}: description 비어있음 — 채울 것`);
  if (!m.version || m.version === "0.0.0") warn(`${who}: version '${m.version ?? "없음"}' — 실제 버전으로`);
}

// --- Codex 포인터 커버리지 (존재하는 컴포넌트마다 포인터 필요) ---
if (xm) {
  const skillsDir = join(pluginDir, "skills");
  const hasSkills = existsSync(skillsDir) && readdirSync(skillsDir, { withFileTypes: true }).some((e) => e.isDirectory());
  if (hasSkills && !xm.skills) err("codex 매니페스트에 `skills` 포인터 없음 — skills/가 있는데 Codex가 못 찾음");
  else if (hasSkills && !existsSync(resolve(pluginDir, xm.skills))) warn(`codex \`skills\` 포인터 대상 없음: ${xm.skills}`);
  else if (hasSkills) ok("codex `skills` 포인터 resolve");

  if (existsSync(join(pluginDir, "hooks", "hooks.json")) && !xm.hooks) warn("codex 매니페스트에 `hooks` 포인터 없음 — hooks/hooks.json 존재");
  if (existsSync(join(pluginDir, ".mcp.json")) && !xm.mcpServers) warn("codex 매니페스트에 `mcpServers` 포인터 없음 — .mcp.json 존재");
}

// --- 도구 전용 키 누수 ---
const claudeOnly = ["commands", "agents", "outputStyles", "lspServers", "userConfig", "channels"];
const codexOnly = ["apps", "interface"];
if (xm) for (const k of claudeOnly) if (k in xm) warn(`codex 매니페스트에 Claude 전용 키 '${k}' — 무시되거나 오류`);
if (cm) for (const k of codexOnly) if (k in cm) warn(`claude 매니페스트에 Codex 전용 키 '${k}' — 무시됨`);

// --- 마켓플레이스 (repo 루트 walk-up) ---
let root = pluginDir;
for (let i = 0; i < 6; i++) {
  if (existsSync(join(root, ".claude-plugin", "marketplace.json")) || existsSync(join(root, ".agents", "plugins", "marketplace.json")) || existsSync(join(root, ".git"))) break;
  const up = dirname(root); if (up === root) break; root = up;
}
const cMkt = join(root, ".claude-plugin", "marketplace.json");
const xMkt = join(root, ".agents", "plugins", "marketplace.json");
if (existsSync(cMkt)) {
  const m = readJSON(cMkt);
  if (m) {
    if (!m.owner?.name || m.owner.name === "TODO") warn(`claude marketplace: owner.name 미설정('${m.owner?.name ?? "없음"}')`);
    else ok("claude marketplace owner 설정됨");
    for (const p of m.plugins ?? []) {
      const src = typeof p.source === "string" ? p.source : null;
      if (src && !existsSync(resolve(root, src))) warn(`claude marketplace: source 경로 없음 ${src}`);
    }
  }
} else warn("claude marketplace.json 없음 (.claude-plugin/)");
if (existsSync(xMkt)) {
  const m = readJSON(xMkt);
  if (m) {
    ok("codex marketplace.json 존재 (.agents/plugins/)");
    // codex 0.140 스키마 강제 — Claude 마켓은 owner{}, codex 마켓은 name+interface (섞으면 codex 가 거부).
    if (!m.name) err(`codex marketplace: 최상위 'name' 없음 — codex 0.140 은 'owner' 가 아니라 'name'+interface 를 쓴다 (Claude 스키마 누수?)`);
    else ok(`codex marketplace name '${m.name}'`);
    if (m.owner) warn(`codex marketplace: Claude 식 'owner' 키 있음 — codex 는 무시(name/interface 를 봄)`);
    if (!m.interface?.displayName) warn(`codex marketplace: interface.displayName 권장(codex 표시명)`);
    const INSTALL = new Set(["AVAILABLE", "NOT_AVAILABLE", "INSTALLED_BY_DEFAULT"]);
    const AUTH = new Set(["ON_INSTALL", "ON_USE"]);
    for (const p of m.plugins ?? []) {
      const sp = p.source?.path;
      if (sp && !existsSync(resolve(root, sp))) warn(`codex marketplace: source.path 없음 ${sp}`);
      if (sp === ".") err(`codex marketplace '${p.name}': source.path '.' — codex 는 plugins/<name>/ 서브디렉터리를 기대(루트는 'No plugins found'). ./plugins/<name> 로.`);
      if (!p.policy) { warn(`codex marketplace: '${p.name}' policy 없음`); continue; }
      if (!INSTALL.has(p.policy.installation)) err(`codex marketplace '${p.name}': policy.installation '${p.policy.installation}' 무효 — ${[...INSTALL].join("·")} 중 하나 (codex 0.140)`);
      if ("authentication" in p.policy && !AUTH.has(p.policy.authentication)) err(`codex marketplace '${p.name}': policy.authentication '${p.policy.authentication}' 무효 — 생략 또는 ${[...AUTH].join("·")} (codex 0.140)`);
    }
  }
} else warn("codex marketplace.json 없음 (.agents/plugins/)");

// --- (휴리스틱) 호스트 결합 lint: hooks 명령 + bin/ 스크립트만 스캔 ---
const smells = [
  { re: /\b(tsc|eslint|prettier|jest|vitest|mocha|pytest|ruff|rubocop|gofmt|black)\b/, msg: "특정 도구 하드코딩 — 능력 계약(capabilities)으로?" },
  { re: /\b(npm run|pnpm run|yarn run|bun run)\b/, msg: "패키지매니저 명령 하드코딩 — 감지/계약으로?" },
  { re: /\/Users\/|\/home\/[a-z]/, msg: "절대/홈 경로 — ${CLAUDE_PLUGIN_ROOT}/${CLAUDE_PROJECT_DIR}로" },
  { re: /(^|[^.\w])\.\/(package\.json|tsconfig\.json|src\/)/, msg: "호스트 구조 가정(package.json/src 등) — 감지/계약으로?" },
];
const scanTexts = [];
const hooksJson = join(pluginDir, "hooks", "hooks.json");
if (existsSync(hooksJson)) {
  const collect = (o) => {
    if (!o || typeof o !== "object") return;
    for (const [k, v] of Object.entries(o)) {
      if (k === "command" && typeof v === "string") scanTexts.push(["hooks.json:command", v]);
      else collect(v);
    }
  };
  collect(readJSON(hooksJson));
}
const binDir = join(pluginDir, "bin");
if (existsSync(binDir)) {
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
  for (const f of walk(binDir)) if (/\.(mjs|js|cjs|sh|py|ts)$/.test(f)) scanTexts.push([relative(pluginDir, f), readFileSync(f, "utf8")]);
}
let coupling = 0;
for (const [where, text] of scanTexts) for (const s of smells) if (s.re.test(text)) { warn(`결합 냄새 [${where}]: ${s.msg}`); coupling++; }
if (scanTexts.length === 0) note("결합 lint: 스캔할 hooks 명령·bin/ 스크립트 없음");
else if (coupling === 0) ok("결합 냄새 없음 (hooks 명령 + bin/ 스크립트)");
note("결합(스멜) lint는 휴리스틱: hooks 명령 + bin/ 스크립트만. 추출 규율: references/portability.md");

// --- 결합 lint(스킬): 스킬이 *다른* 스킬의 disposable 콘텐츠(examples/)를 링크하면 결합 ---
// (self-harden 1호 사례: core/engine ↛ disposable 콘텐츠. 펜스/인라인코드는 예시라 스킵; 자기 examples는 면제.)
const skillsRoot = join(pluginDir, "skills");
if (existsSync(skillsRoot)) {
  const walkMd = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walkMd(join(d, e.name)) : (e.name.endsWith(".md") ? [join(d, e.name)] : []));
  const linksOf = (text) => {
    const out = []; let fence = false;
    for (const line of text.split(/\r?\n/)) {
      if (/^\s*```/.test(line)) { fence = !fence; continue; }
      if (fence) continue;
      for (const mm of line.replace(/`[^`]*`/g, "").matchAll(/\]\(([^)]+)\)/g)) out.push(mm[1]);
    }
    return out;
  };
  const skillDirs = readdirSync(skillsRoot, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  let crossRef = 0;
  for (const s of skillDirs) {
    for (const f of walkMd(join(skillsRoot, s))) {
      for (const target of linksOf(readFileSync(f, "utf8"))) {
        if (/^(https?:|#|\$|<|mailto:)/.test(target) || target === "") continue;
        const rel = relative(skillsRoot, resolve(dirname(f), target.split("#")[0]));
        const mm = rel.match(/^([^/\\]+)[/\\](examples)[/\\]/);
        if (mm && mm[1] !== s) { err(`결합: 스킬 '${s}' 이 다른 스킬 '${mm[1]}' 의 ${mm[2]}/ 를 링크 (${target}) — disposable 콘텐츠 의존. SKILL.md(공개 계약)만 참조하라`); crossRef++; }
      }
    }
  }
  if (skillDirs.length && crossRef === 0) ok("결합 lint(스킬): 다른 스킬의 examples 직접 링크 없음");
}

console.log(`result: ${errors} error(s), ${warns} warning(s)`);
process.exit(errors === 0 ? 0 : 1);
