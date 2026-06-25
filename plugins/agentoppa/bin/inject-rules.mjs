#!/usr/bin/env node
// 항상 지키는 규칙 끼워넣기 (SessionStart 훅) — 플러그인이 깔린 모든 세션 시작 때
// always-on.md 를 세션 컨텍스트로 넣는다. 그래서 매 스킬·컴포넌트에 규칙을 다시 안 적어도 된다.
// 자기 파일 위치에서 플러그인 루트를 찾는다(경로 변수 불필요) → Claude·Codex 동일.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url))); // bin/ → 플러그인 루트
const rulesPath = join(root, "always-on.md");
if (!existsSync(rulesPath)) process.exit(0);

const rules = readFileSync(rulesPath, "utf8").trim();
if (!rules) process.exit(0);

process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: rules },
}));
process.exit(0);
