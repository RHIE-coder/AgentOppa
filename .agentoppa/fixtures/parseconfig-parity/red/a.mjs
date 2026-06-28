import { readFileSync } from "node:fs";
// red 짝 A — 정상 parser. B 가 동작이 달라(drift) 검사기가 '불일치'를 잡아야.
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
