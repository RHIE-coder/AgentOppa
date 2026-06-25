#!/usr/bin/env node
// 정정 큐 알람 (SessionStart 훅) — .agentoppa/candidates/ 에 아직 처리 안 한 정정이
// 남아 있으면 세션 시작 때 한 번 알려준다. 막지 않는다(알림만).
// stdin으로 JSON(cwd 포함)을 받는다. Node 빌트인만 → mac·linux·windows 동일.
// 경로 변수는 안 쓴다(프로젝트 위치는 stdin cwd로) → 크로스툴.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

let cwd = process.cwd();
try {
  const input = JSON.parse(readFileSync(0, "utf8"));
  if (input && typeof input.cwd === "string") cwd = input.cwd;
} catch { /* stdin 없거나 JSON 아님 → cwd 폴백 */ }

const dir = join(cwd, ".agentoppa", "candidates");
const pending = existsSync(dir)
  ? readdirSync(dir).filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
  : [];

if (pending.length === 0) process.exit(0); // 비어 있으면 조용히

const msg =
  `처리 안 한 정정 ${pending.length}개가 .agentoppa/candidates/ 에 남아 있다: ${pending.join(", ")}. ` +
  `/self-harden 으로 가드를 박고 비우거나, 필요 없으면 지워라.`;

process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: msg },
}));
process.exit(0);
