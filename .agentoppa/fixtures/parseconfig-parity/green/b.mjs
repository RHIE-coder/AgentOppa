import { readFileSync } from "node:fs";
// green 짝 — a.mjs 와 parseConfig 동작이 동일(같은 결과). 검사기가 '일치'를 통과시켜야.
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
