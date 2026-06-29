#!/usr/bin/env node
// board.mjs — 결정 보드 렌더러 (zero-dep = 외부 패키지 의존 0 · 크로스OS)
//
// 면담·제안의 '갈림길'(트레이드오프 있는 선택, 워크플로우 단계 명세)을 한눈에 보는
// 읽기용 HTML 을 만들고 OS 기본 브라우저로 띄운다. 터미널의 좁은 선택지 한계를 넘기 위함.
//
//   node board.mjs <data.json|-> [--out <path>] [--no-open]
//
// 입력 = 아래 스키마의 JSON(파일 또는 stdin '-'). 출력 = 자체완결 HTML 1장 + 자동 열기.
// 진실원천은 .harness 문서다 — 이 HTML 은 그걸 사람이 보라고 그린 *일회성 뷰*라,
// 출력 디렉토리에 .gitignore('*')를 깔아 커밋되지 않게 한다.
//
// 스키마(전부 선택, 있는 것만 그림):
//   { title, subtitle, tag,
//     banners:[{kind:"warn|note|info", html}],
//     legend:[{color, label}],
//     flow:["a","→","b",{loop:"loop {…}"}],
//     foot,
//     cards:[{ accent, num, title, mono, opt, badge, gist, tags:[],
//              rows:[{label, value, kind}] }] }
//   row.kind → 라벨색: what/role=먹 · why/action=파랑 · benefit/produces/out=초록
//              · caution/warn=주황 · consumes/in=보라 · (그 외)=회색
//   value/html 은 HTML 을 그대로 허용한다(우리가 생성하는 신뢰 입력 — <b>·<code> 등).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

// --- 인자 ---
const argv = process.argv.slice(2);
let dataPath = null, out = null, open = true;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--out') out = argv[++i];
  else if (a === '--no-open') open = false;
  else if (a === '-h' || a === '--help') { usage(); process.exit(0); }
  else if (!a.startsWith('--')) dataPath = a;
}
function usage() {
  console.error('사용법: node board.mjs <data.json|-> [--out <path>] [--no-open]');
}
if (!dataPath) { usage(); process.exit(2); }

// --- 입력 읽기 ---
let raw;
try { raw = readFileSync(dataPath === '-' ? 0 : dataPath, 'utf8'); }
catch (e) { console.error(`입력을 못 읽음: ${e.message}`); process.exit(2); }
let data;
try { data = JSON.parse(raw); }
catch (e) { console.error(`JSON 파싱 실패: ${e.message}`); process.exit(1); }

// --- kind → 라벨색 ---
const KIND = {
  what: '#111111', role: '#111111',
  why: '#2563eb', action: '#2563eb',
  benefit: '#059669', produces: '#059669', out: '#059669',
  caution: '#b45309', warn: '#b45309',
  consumes: '#7c3aed', in: '#7c3aed',
};
const ACCENT = '#2563eb';
const v = s => String(s ?? ''); // 신뢰 입력 — HTML 그대로

// --- 렌더 조각 ---
const row = r =>
  `<div class="facet"><div class="lab" style="color:${KIND[r.kind] || '#6b7280'}">${v(r.label)}</div><div class="val">${v(r.value)}</div></div>`;

function card(c) {
  const accent = c.accent || ACCENT;
  const num = c.num != null ? `<span class="n" style="color:${accent}">${v(c.num)}</span>` : '';
  const badge = c.badge ? `<span class="badge">${v(c.badge)}</span>` : '';
  const opt = c.opt ? `<span class="opt">${v(c.opt)}</span>` : '';
  const tags = (c.tags || []).map(t => `<span class="tag">${v(t)}</span>`).join('');
  const gist = c.gist ? `<p class="gist">${v(c.gist)}</p>` : '';
  const rows = (c.rows || []).map(row).join('');
  return `<div class="card"><div class="head" style="border-left-color:${accent}">${num}<h2${c.mono ? ' class="mono"' : ''}>${v(c.title)}</h2>${opt}${tags}${badge}<div class="brk"></div>${gist}</div><div class="facets">${rows}</div></div>`;
}

function flow(f) {
  if (!Array.isArray(f) || !f.length) return '';
  const items = f.map(x => {
    if (x && typeof x === 'object' && x.loop) return `<span class="lp">${v(x.loop)}</span>`;
    if (x === '→' || x === '->') return '<span class="arr">→</span>';
    return `<span class="s">${v(x)}</span>`;
  }).join('');
  return `<div class="flowbar">${items}</div>`;
}

function banner(b) {
  const map = { warn: '#fef3c7|#fcd34d|#92400e', note: '#f5f3ff|#ddd6fe|#5b21b6', info: '#eef2ff|#dbe2ff|#3730a3' };
  const [bg, bd, fg] = (map[b.kind] || map.info).split('|');
  return `<div class="banner" style="background:${bg};border-color:${bd};color:${fg}">${v(b.html)}</div>`;
}

const legend = l => !Array.isArray(l) || !l.length ? '' :
  `<div class="legend">${l.map(x => `<span><span class="dot" style="background:${v(x.color)}"></span> ${v(x.label)}</span>`).join('')}</div>`;

const CSS = `
*{box-sizing:border-box}
body{margin:0;background:#f6f7f9;color:#1d2127;line-height:1.62;-webkit-font-smoothing:antialiased;
 font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Malgun Gothic",sans-serif}
.wrap{max-width:1000px;margin:0 auto;padding:30px 20px 64px}
.demo-tag{display:inline-block;background:#fde68a;color:#92400e;font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;margin-bottom:14px}
h1{font-size:24px;margin:0 0 6px;letter-spacing:-.3px}
.sub{color:#6b7280;font-size:15px;margin:0 0 18px}
.banner{border:1px solid;border-radius:12px;padding:14px 18px;margin:0 0 14px;font-size:14px}
.legend{display:flex;flex-wrap:wrap;gap:14px;margin:6px 0 22px;font-size:13px;color:#6b7280}
.legend span{display:inline-flex;align-items:center;gap:6px}
.dot{width:9px;height:9px;border-radius:50%;display:inline-block}
.flowbar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;background:#fff;border:1px solid #e6e8ec;border-radius:12px;padding:13px 16px;margin:0 0 24px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
.flowbar .s{padding:3px 9px;border-radius:7px;background:#f6f7f9;border:1px solid #e6e8ec;font-weight:600}
.flowbar .arr{color:#6b7280}
.flowbar .lp{padding:3px 9px;border-radius:7px;background:#f3e8ff;border:1px solid #e9d5ff;color:#6b21a8;font-weight:600}
.card{background:#fff;border:1px solid #e6e8ec;border-radius:14px;overflow:hidden;margin-bottom:14px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.head{padding:14px 18px 12px;border-left:5px solid;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.head .n{font-size:12px;font-weight:800;min-width:16px}
.head h2{font-size:18px;margin:0}
.head h2.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.head .tag{font-size:11.5px;color:#6b7280;background:#f6f7f9;border:1px solid #e6e8ec;border-radius:999px;padding:1px 9px;font-weight:600}
.head .opt{font-size:11.5px;color:#92400e;background:#fef3c7;border:1px solid #fcd34d;border-radius:999px;padding:1px 9px;font-weight:600}
.head .badge{margin-left:auto;font-size:11.5px;font-weight:700;color:#475569;background:#f6f7f9;border:1px solid #e6e8ec;border-radius:999px;padding:2px 9px}
.head .brk{flex-basis:100%;height:0}
.gist{font-size:13.5px;color:#6b7280;margin:2px 0 0}
.facets{padding:2px 18px 14px}
.facet{display:grid;grid-template-columns:78px 1fr;gap:12px;padding:8px 0;border-top:1px solid #e6e8ec}
.facet .lab{font-size:12px;font-weight:700;padding-top:1px}
.facet .val{font-size:14px}
.foot{margin-top:26px;font-size:12.5px;color:#6b7280;border-top:1px solid #e6e8ec;padding-top:14px}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;background:#f6f7f9;border:1px solid #e6e8ec;border-radius:5px;padding:1px 5px}`;

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${v(data.title || '결정 보드')}</title>
<style>${CSS}</style></head>
<body><div class="wrap">
${data.tag ? `<span class="demo-tag">${v(data.tag)}</span>` : ''}
<h1>${v(data.title || '결정 보드')}</h1>
${data.subtitle ? `<p class="sub">${v(data.subtitle)}</p>` : ''}
${(data.banners || []).map(banner).join('')}
${legend(data.legend)}
${flow(data.flow)}
${(data.cards || []).map(card).join('')}
${data.foot ? `<p class="foot">${v(data.foot)}</p>` : ''}
</div></body></html>`;

// --- 쓰기 (+ 일회성 뷰라 gitignore) ---
const outPath = out || join('.harness', 'decision-board', 'board.html');
mkdirSync(dirname(outPath), { recursive: true });
const gi = join(dirname(outPath), '.gitignore');
if (!existsSync(gi)) writeFileSync(gi, '*\n'); // 진실원천 아님 — 커밋 안 함
writeFileSync(outPath, html);
console.log(`보드 생성: ${outPath}`);

// --- 자동 열기 (크로스OS) ---
function openFile(p) {
  const plat = process.platform;
  const [cmd, args] =
    plat === 'darwin' ? ['open', [p]] :
    plat === 'win32' ? ['cmd', ['/c', 'start', '', p]] :
    ['xdg-open', [p]];
  try { spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref(); }
  catch (e) { console.error(`자동 열기 실패 — 직접 여세요: ${p} (${e.message})`); }
}
if (open) openFile(outPath);
