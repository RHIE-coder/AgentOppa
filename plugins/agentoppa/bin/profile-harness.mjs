#!/usr/bin/env node
// harness 프로파일러 (정적 · 워크플로우 타당성 반쪽) — .harness/(config+phase 그래프)를 읽어
//   *분석객체 1개*를 만들고 → JSON(데이터) + HTML(브라우저 뷰) + 콘솔(텍스트)로 낸다. 한 소스 → 여러 뷰(드리프트 0).
//   토큰·시간(dynamic 반쪽)은 라이브 세션 로그가 필요 → 후속 증분. 여긴 라이브 실행 불필요(fixture로 검증).
// 사용법: node profile-harness.mjs [.harness/config.yaml] [--out-dir <dir>] [--no-write]
//   콘솔(stdout) 텍스트는 항상. 파일은 기본 cwd 에 analyzed.json · analyzed.html (--out-dir 로 위치, --no-write 로 끔).
//   analyzed.html = self-contained 단일 파일(서버 없음 · inline CSS · JSON 내장) → file:// 더블클릭으로 열림.
//     (HTML이 런타임에 JSON을 fetch하면 file://에서 CORS로 막힘 → 그래서 같은 JSON을 HTML에 내장하고 서버사이드 렌더.)
// 참고용: 세 산출 다 *참고용 진단* — contract 산출물 아님(아무 phase도 consume 안 함 · lock 무관 · artifacts/ 밖 · 엔진이 도로 안 먹음, 돌고 끝나는 검사 러너).
//   연결·신선도 *판정*의 권위는 validate(.harness/core/validate.mjs · agent-engineer).
// 종료코드: 항상 0(게이트 아님). config 없으면 2. Node 빌트인만 → mac·linux·windows 동일.
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

// ---------- 인자 ----------
const argv = process.argv.slice(2);
let cfgPath = null, outDir = ".", noWrite = false;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--no-write") noWrite = true;
  else if (a === "--out-dir") outDir = argv[++i];
  else if (!a.startsWith("--")) cfgPath = a;
}
cfgPath = cfgPath ?? ".harness/config.yaml";
if (!existsSync(cfgPath)) { console.error(`harness 프로파일러: config 없음 → ${cfgPath}`); process.exit(2); }
const harnessDir = dirname(cfgPath);

// ---------- config.yaml 파서 (agent-engineer validate.mjs 와 동일 양식 — 드리프트 방지. TODO: core/ 공용 모듈로 추출) ----------
const clean = (s) => s.replace(/\s*#.*$/, "").trim().replace(/^["']|["']$/g, "");
const splitList = (s) => s.replace(/^\[|\]$/g, "").split(",").map((x) => x.trim()).filter(Boolean);

function parseConfig(text) {
  const lines = text.split(/\r?\n/);
  const cfg = { scalars: {}, values: {}, phases: [] };
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.trim() === "" || /^\s*#/.test(l)) { i++; continue; }
    if (/^phases:\s*$/.test(l)) { i = parsePhases(lines, i + 1, cfg); continue; }
    if (/^values:\s*$/.test(l)) { i = parseValues(lines, i + 1, cfg); continue; }
    const m = l.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (m && m[2].trim() !== "") cfg.scalars[m[1]] = clean(m[2]);
    i++;
  }
  return cfg;
}
function parseValues(lines, i, cfg) {
  while (i < lines.length) {
    const l = lines[i];
    if (l.trim() === "" || /^\s*#/.test(l)) { i++; continue; }
    if (!/^\s+/.test(l)) break;
    const m = l.match(/^\s+([A-Za-z_][\w-]*):\s*(.*)$/);
    if (m) cfg.values[m[1]] = clean(m[2]);
    i++;
  }
  return i;
}
function parsePhases(lines, i, cfg) {
  while (i < lines.length) {
    const l = lines[i];
    if (l.trim() === "" || /^\s*#/.test(l)) { i++; continue; }
    if (!/^\s+-/.test(l)) break;
    const v = (l.match(/^\s*-\s*(.+?)\s*$/) || [])[1];
    if (!v) { i++; continue; }
    if (/^loop:/.test(v)) {
      const loop = { type: "loop", do: [], until: null, max: null };
      const inline = v.match(/\{(.+)\}/);
      if (inline) {
        const dm = inline[1].match(/do:\s*\[([^\]]*)\]/); if (dm) loop.do = splitList(dm[1]);
        const um = inline[1].match(/until:\s*["']?([^,"'}]+)["']?/); if (um) loop.until = um[1].trim();
        const mm = inline[1].match(/max:\s*(\d+)/); if (mm) loop.max = +mm[1];
        i++;
      } else {
        const base = l.search(/\S/); i++;
        while (i < lines.length && (lines[i].trim() === "" || lines[i].search(/\S/) > base)) {
          const dm = lines[i].match(/do:\s*\[([^\]]*)\]/); if (dm) loop.do = splitList(dm[1]);
          const um = lines[i].match(/until:\s*["']?([^"'#]+?)["']?\s*(?:#.*)?$/); if (um) loop.until = um[1].trim();
          const mm = lines[i].match(/max:\s*(\d+)/); if (mm) loop.max = +mm[1];
          i++;
        }
      }
      cfg.phases.push(loop);
    } else if (/^\{/.test(v)) {
      const nm = v.match(/name:\s*([^,}\s]+)/);
      const sm = v.match(/sync:\s*([^,}\s]+)/);
      cfg.phases.push({ type: "card", name: nm ? nm[1] : null, sync: sm ? sm[1] : null });
      i++;
    } else {
      cfg.phases.push({ type: "card", name: clean(v) });
      i++;
    }
  }
  return i;
}
function parsePhase(name) {
  const file = join(harnessDir, "project", "phases", `${name}.md`);
  if (!existsSync(file)) return null;
  const fm = readFileSync(file, "utf8").match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  const card = { name, tier: null, gate: null, consumes: [], produces: null, needs: [], workers: null };
  if (!fm) return card;
  let inWorkers = false, inOptions = false;
  for (const l of fm[1].split(/\r?\n/)) {
    if (/^workers:\s*$/.test(l)) { inWorkers = true; inOptions = false; card.workers = { select: null, options: {} }; continue; }
    if (inWorkers && /^\s+/.test(l)) {
      let m;
      if ((m = l.match(/^\s+select:\s*(.+)$/))) card.workers.select = clean(m[1]);
      else if (/^\s+options:\s*$/.test(l)) inOptions = true;
      else if (inOptions && (m = l.match(/^\s+([A-Za-z0-9_-]+):\s*(.+)$/))) card.workers.options[m[1]] = clean(m[2]);
      continue;
    }
    inWorkers = false; inOptions = false;
    let m;
    if ((m = l.match(/^tier:\s*(.+)$/))) card.tier = clean(m[1]);
    else if ((m = l.match(/^gate:\s*(.+)$/))) card.gate = clean(m[1]);
    else if ((m = l.match(/^produces:\s*(.+)$/))) { const x = clean(m[1]); card.produces = (x === "~" || x === "") ? null : x; }
    else if ((m = l.match(/^consumes:\s*(.+)$/))) card.consumes = splitList(m[1]).map((r) => ({ role: r.replace(/\?$/, ""), optional: /\?$/.test(r) }));
    else if ((m = l.match(/^needs:\s*(.+)$/))) card.needs = splitList(m[1]).map((r) => ({ key: r.replace(/\?$/, ""), optional: /\?$/.test(r) }));
  }
  return card;
}

// ---------- 비용 모델 (참고용 · recipe.md routing 표) ----------
const COST = {
  cheap:    { budget: "최저", balanced: "최저", premium: "표준" },
  standard: { budget: "최저", balanced: "표준", premium: "강" },
  strong:   { budget: "표준", balanced: "강",   premium: "최강" },
};
const HP = { "최저": 1, "표준": 2, "강": 3, "최강": 4 };

// ---------- 분석 → 객체 1개 (canonical) ----------
const cfg = parseConfig(readFileSync(cfgPath, "utf8"));
const routing = cfg.scalars.routing ?? "balanced";
const globalSync = cfg.scalars.sync ?? "medium";

const seq = [];      // {name, sync, inLoop}
const loops = [];
for (const p of cfg.phases) {
  if (p.type === "loop") { loops.push(p); for (const n of p.do) seq.push({ name: n, sync: globalSync, inLoop: true }); }
  else seq.push({ name: p.name, sync: p.sync ?? globalSync, inLoop: false });
}
const cards = {};
for (const s of seq) if (s.name && !(s.name in cards)) cards[s.name] = parsePhase(s.name);

const phases = seq.map((s, i) => {
  const card = cards[s.name];
  const tier = card?.tier ?? "standard";
  const costClass = (COST[tier] ?? COST.standard)[routing] ?? "표준";
  return {
    n: i + 1, name: s.name, defined: !!card, tier, costClass, hp: HP[costClass] ?? 2,
    sync: s.sync, inLoop: s.inLoop,
    consumes: card?.consumes ?? [], produces: card?.produces ?? null,
    gate: card?.gate ?? null, blocking: !!(card?.gate && s.sync === "strict"),
    workers: card?.workers && Object.keys(card.workers.options || {}).length
      ? { select: card.workers.select, options: Object.keys(card.workers.options) } : null,
  };
});

// 타당성 관찰 (참고용) — 연결 사실은 contract §4 미러, 판정 권위는 validate
const observations = [];
const add = (level, msg) => observations.push({ level, msg });
const produced = new Set(), producedBy = {}, consumed = new Set();
for (const s of seq) {
  const card = cards[s.name];
  if (!card) { add("warn", `'${s.name}' 정의 파일 없음 (project/phases/${s.name}.md) — 즉석 저작 대상.`); continue; }
  for (const cn of card.consumes) {
    consumed.add(cn.role);
    if (!produced.has(cn.role) && !cn.optional) add("error", `dangling 입력: '${s.name}' ← '${cn.role}' (앞에서 produces 없음 · validate가 error로 강제).`);
  }
  if (card.produces) {
    if (produced.has(card.produces)) add("error", `중복 produces: '${card.produces}' (${producedBy[card.produces]} & ${s.name}).`);
    produced.add(card.produces); producedBy[card.produces] = s.name;
  }
}
for (const role of produced) if (!consumed.has(role)) add("info", `종착 산출물: '${role}' (${producedBy[role]}) — 소비자 없음(의도면 OK).`);
for (const p of phases) {
  if (!p.defined) continue;
  if (p.gate) {
    if (p.blocking) add("info", `차단 게이트: '${p.name}' (sync=strict) — 미충족 시 다음 진입 차단.`);
    else add("warn", `비강제 게이트: '${p.name}' (sync=${p.sync}) — ${p.sync === "medium" ? "경고만, 진행 가능" : "산문 안내만"}; 사람이 확인.`);
  }
  if (p.workers) add("info", `보조 에이전트(${p.workers.select}): '${p.name}' → ${p.workers.options.join(", ")} — ${p.workers.select === "dynamic" ? "조건부 팬아웃, 비용·시간 가변" : "고정 추가 비용"}.`);
}
for (const lp of loops) add("info", `loop: [${lp.do.join(", ")}] until "${lp.until ?? "?"}" max ${lp.max ?? "?"} — 최대 ${lp.max ?? "?"}회 반복(비용 최대 ${lp.max ?? "?"}배).`);

const analysis = {
  schema: "agentoppa.harness-profile/1",
  half: "static",                          // 정적 반쪽 (토큰·시간 = dynamic, 후속)
  advisory: true,                          // 참고용 — 엔진이 도로 안 먹는다
  generated: new Date().toISOString(),
  source: cfgPath,
  harness: cfg.scalars.harness ?? null,
  feature: cfg.scalars.feature ?? null,
  routing, sync: globalSync,
  phases, loops: loops.map((l) => ({ do: l.do, until: l.until, max: l.max })),
  cost: {
    unit: "hp (참고용 상대단위 · tier×routing)",
    baseHp: phases.reduce((a, p) => a + p.hp, 0),
    hasWorkers: phases.some((p) => p.workers),
    maxLoopMult: loops.reduce((a, l) => Math.max(a, l.max || 1), 1),
  },
  counts: {
    phases: phases.length,
    strictGates: phases.filter((p) => p.blocking).length,
    loops: loops.length,
  },
  observations,
};

// ---------- 뷰 (한 분석객체 → 여러 형식) ----------
function toJson(a) { return JSON.stringify(a, null, 2); }

function toMarkdown(a) {
  const L = [];
  L.push(`# harness 프로파일 (참고용)`); L.push("");
  L.push(`source : ${a.source}`);
  L.push(`harness: ${a.harness ?? "(이름 없음)"}   feature: ${a.feature ?? "(미지정)"}`);
  L.push(`routing: ${a.routing}   sync(전역): ${a.sync}   생성: ${a.generated}`); L.push("");
  L.push(`## 1. 흐름 (phases)`);
  for (const p of a.phases) {
    const t = [`tier ${p.tier}→${p.costClass}(hp ${p.hp})`, `sync ${p.sync}`];
    if (p.consumes.length) t.push(`consumes ${p.consumes.map((c) => c.role + (c.optional ? "?" : "")).join(",")}`);
    if (p.produces) t.push(`produces ${p.produces}`);
    if (p.gate) t.push(`gate ${p.blocking ? "🚧차단" : "안내"}`);
    if (p.workers) t.push(`workers ${p.workers.select}:${p.workers.options.join(",")}`);
    if (p.inLoop) t.push("loop");
    if (!p.defined) t.push("정의없음");
    L.push(`${p.n}. ${p.name}  ·  ${t.join("  ·  ")}`);
  }
  L.push("");
  L.push(`직렬 단계: ${a.counts.phases}  ·  차단 게이트(strict): ${a.counts.strictGates}  ·  loop: ${a.counts.loops}`); L.push("");
  L.push(`## 2. 비용 추정 (참고용 · tier × routing=${a.routing})`);
  for (const p of a.phases) L.push(`   ${p.name.padEnd(14)} ${p.costClass.padEnd(4)} hp ${p.hp}`);
  L.push(`   ${"─".repeat(24)}`);
  let total = `base 합계: hp ${a.cost.baseHp}`;
  if (a.cost.hasWorkers) total += `  (+ workers 가변)`;
  if (a.cost.maxLoopMult > 1) total += `  (+ loop 최대 ×${a.cost.maxLoopMult})`;
  L.push(`   ${total}`);
  L.push(`※ 정적 추정일 뿐. 실제 토큰·시간은 라이브 세션 로그로 측정한다(dynamic 반쪽, 후속 증분).`); L.push("");
  L.push(`## 3. 타당성 관찰 (참고용)`);
  const icon = { error: "✗", warn: "⚠", info: "•" };
  if (a.observations.length) for (const o of a.observations) L.push(`- ${icon[o.level] || "•"} ${o.msg}`);
  else L.push(`- 특이사항 없음.`);
  L.push(""); L.push(`---`);
  L.push(`※ 이 리포트는 참고용 — 강제·게이트 아님(엔진이 도로 안 먹는다). 연결·신선도의 *판정*은 \`node .harness/core/validate.mjs\`(또는 agent-engineer validate)가 권위.`);
  return L.join("\n");
}

function toHtml(a) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const syncColor = { strict: "#c0392b", medium: "#b8860b", loose: "#7f8c8d" };
  const flow = a.phases.map((p) => {
    const badges = [
      `<span class="b">tier ${esc(p.tier)}→${esc(p.costClass)} · hp ${p.hp}</span>`,
      `<span class="b" style="border-color:${syncColor[p.sync] || "#999"};color:${syncColor[p.sync] || "#333"}">sync ${esc(p.sync)}</span>`,
      p.gate ? `<span class="b">${p.blocking ? "🚧 차단" : "gate 안내"}</span>` : "",
      p.workers ? `<span class="b">👤 ${esc(p.workers.select)}: ${p.workers.options.map(esc).join(", ")}</span>` : "",
      p.inLoop ? `<span class="b">🔁 loop</span>` : "",
      !p.defined ? `<span class="b warn">정의없음</span>` : "",
    ].filter(Boolean).join(" ");
    const io = [
      p.consumes.length ? `← ${p.consumes.map((c) => esc(c.role) + (c.optional ? "?" : "")).join(", ")}` : "",
      p.produces ? `→ ${esc(p.produces)}` : "",
    ].filter(Boolean).join("  ");
    return `<div class="ph"><div class="ph-h">${p.n}. ${esc(p.name)}</div><div class="badges">${badges}</div>${io ? `<div class="io">${io}</div>` : ""}</div>`;
  }).join(`<div class="arrow">▶</div>`);

  const maxHp = Math.max(1, ...a.phases.map((p) => p.hp));
  const bars = a.phases.map((p) =>
    `<div class="bar-row"><span class="bar-label">${esc(p.name)}</span><span class="bar" style="width:${Math.round(p.hp / maxHp * 220)}px"></span><span class="bar-num">${esc(p.costClass)} · hp ${p.hp}</span></div>`
  ).join("");
  let total = `base 합계: hp ${a.cost.baseHp}`;
  if (a.cost.hasWorkers) total += " (+ workers 가변)";
  if (a.cost.maxLoopMult > 1) total += ` (+ loop 최대 ×${a.cost.maxLoopMult})`;

  const obsLi = a.observations.map((o) => `<li class="lvl-${o.level}">${esc(o.msg)}</li>`).join("");
  const island = JSON.stringify(a).replace(/</g, "\\u003c"); // </script> 조기종료·XSS 방지

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>harness 프로파일 — ${esc(a.harness ?? "")}</title>
<style>
:root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
body{margin:0;padding:24px;color:#222;background:#fafafa;line-height:1.5}
h1{font-size:18px;margin:0 0 4px} .meta{color:#666;font-size:13px;margin-bottom:20px}
.note{font-size:12px;color:#888;border-left:3px solid #ddd;padding:6px 10px;margin:18px 0}
h2{font-size:14px;border-bottom:1px solid #eee;padding-bottom:4px;margin-top:28px}
.flow{display:flex;align-items:stretch;gap:6px;flex-wrap:wrap}
.ph{border:1px solid #ddd;border-radius:8px;padding:10px 12px;background:#fff;min-width:150px}
.ph-h{font-weight:600;margin-bottom:6px} .badges{display:flex;flex-wrap:wrap;gap:4px}
.io{margin-top:6px;font-size:11px;color:#888}
.b{font-size:11px;border:1px solid #ccc;border-radius:10px;padding:1px 7px;color:#444;background:#fff}
.b.warn{border-color:#b8860b;color:#b8860b}
.arrow{display:flex;align-items:center;color:#bbb;font-size:14px}
.bar-row{display:flex;align-items:center;gap:10px;margin:3px 0;font-size:13px}
.bar-label{width:90px;text-align:right;color:#444}
.bar{height:14px;background:#7aa7d8;border-radius:3px;display:inline-block}
.bar-num{color:#666;font-size:12px} .total{margin-top:8px;font-weight:600}
ul{padding-left:0;list-style:none} li{font-size:13px;padding:4px 10px;margin:3px 0;border-radius:5px;background:#fff;border-left:4px solid #ccc}
.lvl-error{border-color:#c0392b;background:#fdf0ee} .lvl-warn{border-color:#b8860b;background:#fcf7e9} .lvl-info{border-color:#5b8bbf;background:#f2f6fb}
.counts{font-size:13px;color:#555;margin-top:8px}
code{background:#eee;padding:1px 4px;border-radius:3px}
</style></head>
<body>
<h1>harness 프로파일 (참고용) — ${esc(a.harness ?? "(이름 없음)")}</h1>
<div class="meta">source ${esc(a.source)} · feature ${esc(a.feature ?? "(미지정)")} · routing ${esc(a.routing)} · sync(전역) ${esc(a.sync)} · 생성 ${esc(a.generated)}</div>
<h2>① 흐름 (phases)</h2>
<div class="flow">${flow}</div>
<div class="counts">직렬 단계 ${a.counts.phases} · 차단 게이트(strict) ${a.counts.strictGates} · loop ${a.counts.loops}</div>
<h2>② 비용 추정 (참고용 · tier × routing=${esc(a.routing)})</h2>
${bars}
<div class="total">${esc(total)}</div>
<div class="note">정적 추정일 뿐. 실제 토큰·시간은 라이브 세션 로그로 측정한다(dynamic 반쪽, 후속 증분).</div>
<h2>③ 타당성 관찰 (참고용)</h2>
<ul>${obsLi || "<li class=\"lvl-info\">특이사항 없음.</li>"}</ul>
<div class="note">이 리포트는 <b>참고용</b> — 강제·게이트 아님(엔진이 도로 안 먹는다, 돌고 끝나는 검사 러너). 연결·신선도의 <i>판정</i>은 <code>node .harness/core/validate.mjs</code>(또는 agent-engineer validate)가 권위.</div>
<script type="application/json" id="harness-profile">${island}</script>
</body></html>
`;
}

// ---------- 출력 ----------
process.stdout.write(toMarkdown(analysis) + "\n");
if (!noWrite) {
  mkdirSync(outDir, { recursive: true });
  const jp = join(outDir, "analyzed.json"); writeFileSync(jp, toJson(analysis) + "\n");
  const hp = join(outDir, "analyzed.html"); writeFileSync(hp, toHtml(analysis));
  process.stdout.write(`\n참고용 산출(데이터+뷰) → ${resolve(jp)}\n                       ${resolve(hp)}  (file://로 열기)\n`);
}
process.exit(0);
