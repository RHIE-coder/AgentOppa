#!/usr/bin/env node
// 금지 조어 검사기 — always-on.md 가 "금지 예시"로 등재한 조어를 커밋된 markdown 본문이 쓰는지 점검.
//   왜: always-on "쉬운 말로 쓴다(지어낸 말 금지)"의 *기계 조각*. 새 조어인지의 판단은 기계화 못 한다(맹점)
//        → 그건 always-on 규칙이 담당. 여기선 *이미 명시적으로 금지 예시로 등재된* 단어만 기계로 막는다.
//        (check-doc-refs 가 "링크형만 기계화, 산문형은 always-on" 으로 쪼갠 것과 동형.)
//   단일 소스: 금지어 목록을 검사기에 박지 않고 always-on.md 의 `예: "<단어>"`(금지 문맥 줄)에서 뽑는다.
//        → always-on.md 에 예시를 더하면 검사기가 그 단어도 자동으로 막는다(인스턴스 비박음·드리프트 0).
//   점검: 대상 트리에서 always-on.md 를 만나면 금지어를 추출하고, 다른 .md 본문(코드블록·인라인코드 제외)에
//        그 단어가 나오면 error. always-on.md 자신·hardening-log.md 는 제외(금지어를 정의·기록하는 자리).
//   목록을 못 찾으면 검사 생략 + exit 0 (부재 단정 금지 — 못 찾음을 위반으로 두지 않는다).
// 사용법: node check-banned-terms.mjs [파일 또는 디렉터리]   (기본: cwd)
// 종료코드: 위반 0건이면 0, 있으면 1, 경로 없으면 2. Node 빌트인만 → mac·linux·windows 동일.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";

const c = { r: "\x1b[31m", y: "\x1b[33m", g: "\x1b[32m", x: "\x1b[0m" };
let errors = 0;
const err = (m) => { console.log(`  ${c.r}✗${c.x} ${m}`); errors++; };

const SKIP_DIRS = new Set(["node_modules", ".git", ".agentoppa", "qa", ".next", ".next-test", "dist", "build"]);

const target = process.argv[2] ?? ".";
console.log(`check-banned-terms → ${target}`);
if (!existsSync(target)) { err(`경로 없음: ${target}`); process.exit(2); }

function mdFiles(p) {
  if (statSync(p).isFile()) return extname(p) === ".md" ? [p] : [];
  const out = [];
  for (const name of readdirSync(p)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(p, name);
    if (statSync(full).isDirectory()) out.push(...mdFiles(full));
    else if (extname(full) === ".md") out.push(full);
  }
  return out;
}

// always-on.md 의 "금지" 문맥 줄에서 `예: "<단어>"`(곧은/굽은 따옴표) 안의 조어를 뽑는다.
function bannedTermsFrom(text) {
  const terms = new Set();
  for (const line of text.split(/\r?\n/)) {
    if (!line.includes("금지")) continue;
    const re = /예:\s*["“]([^"”]+)["”]/g;
    let m;
    while ((m = re.exec(line))) terms.add(m[1].trim());
  }
  return terms;
}

// 코드블록(``` ~~~) 밖의 줄만, 인라인코드(`…`)는 떼고 줄번호와 함께 반환(예시 인용은 위반 아님).
function proseLines(text) {
  const out = [];
  let inFence = false;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) { inFence = !inFence; continue; }
    if (inFence) continue;
    out.push({ n: i + 1, content: lines[i].replace(/`[^`]*`/g, "") });
  }
  return out;
}

const files = mdFiles(target);
const banned = new Set();
for (const f of files) if (basename(f) === "always-on.md")
  for (const t of bannedTermsFrom(readFileSync(f, "utf8"))) banned.add(t);

if (banned.size === 0) {
  console.log(`  ${c.y}⚠${c.x} always-on.md 의 금지어 목록을 못 찾음 — 검사 생략(부재 단정 금지).`);
  process.exit(0);
}
console.log(`  금지 조어 ${banned.size}건: ${[...banned].map((t) => `'${t}'`).join(", ")}`);

let scanned = 0;
for (const file of files) {
  const base = basename(file);
  if (base === "always-on.md" || base === "hardening-log.md") continue; // 금지어를 정의·기록하는 자리
  scanned++;
  const text = readFileSync(file, "utf8");
  for (const { n, content } of proseLines(text))
    for (const term of banned)
      if (content.includes(term))
        err(`${file}:${n}: 금지 조어 '${term}' — always-on.md 가 금지 예시로 등재한 멋부린 조어. 쉬운 말로 바꿀 것.`);
}

console.log(`result: ${errors} error(s)  · .md ${scanned}건 점검`);
process.exit(errors === 0 ? 0 : 1);
