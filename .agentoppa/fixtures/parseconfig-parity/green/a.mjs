import { readFileSync } from "node:fs";
// 최소 parseConfig — parity 검사기의 SAMPLES 를 받아도 결정적 결과를 내는 작은 파서. (green: a·b 동작 동일)
function parseConfig(text) {
  const cfg = { scalars: {}, phases: [] };
  for (const l of text.split(/\r?\n/)) {
    const m = l.match(/^([A-Za-z_][\w-]*):\s*(.+)$/);
    if (m) cfg.scalars[m[1]] = m[2].replace(/\s+#.*$/, "").trim();
    const d = l.match(/^\s*-\s*(.+?)\s*$/);
    if (d) cfg.phases.push(d[1].replace(/\s+#.*$/, "").trim());
  }
  return cfg;
}
if (process.env.PARSECONFIG_DUMP) {
  process.stdout.write(JSON.stringify(parseConfig(readFileSync(process.env.PARSECONFIG_DUMP, "utf8"))));
  process.exit(0);
}
