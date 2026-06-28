#!/usr/bin/env node
// qa/checks/resume.mjs — resume_equivalent 판정의 standalone validator (red/green fixture 용).
//   fixture dir 모양: baseline/ 와 resumed/ 두 산출 세트. 각 아래 .md 들이 산출물,
//     인계 순서는 파일명 앞 숫자 접두로 인코딩(예: 01-spec.md, 02-impl.md). role = 접두·확장자 뗀 것.
//   사용법: node qa/checks/resume.mjs <fixtureDir>   exit 0=통과(동등), 1=비동등, 2=입력오류.
//   판정 본체는 lib/resume.mjs (run.mjs JUDGE 와 동일 모듈 공유 → 한 곳만 테스트하면 둘 다 보증).
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { judgeResumeEquivalent } from "./lib/resume.mjs";
import { parseDocHeader } from "./lib/contract.mjs";

const dir = process.argv[2];
if (!dir || !existsSync(dir)) { console.log(`✗ fixture dir 없음: ${dir}`); process.exit(2); }
const baseDir = join(dir, "baseline"), resDir = join(dir, "resumed");
if (!existsSync(baseDir) || !existsSync(resDir)) {
  console.log(`✗ fixture 는 baseline/ 와 resumed/ 를 가져야 함: ${dir}`); process.exit(2);
}

const loadDocs = (d) =>
  readdirSync(d).filter((f) => f.endsWith(".md")).sort().map((f) => {
    const { hasHeader, header } = parseDocHeader(readFileSync(join(d, f), "utf8"));
    return { role: f.replace(/\.md$/, "").replace(/^\d+[-_]/, ""), hasHeader, header };
  });

const r = judgeResumeEquivalent(loadDocs(baseDir), loadDocs(resDir));
console.log(`${r.ok ? "✓" : "✗"} ${r.msg}`);
process.exit(r.ok ? 0 : 1);
