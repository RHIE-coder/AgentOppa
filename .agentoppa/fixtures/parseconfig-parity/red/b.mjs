import { readFileSync } from "node:fs";
// red 짝 B — A 와 *동작이 갈린* parser: phase 이름을 대문자로 저장(의도적 drift). 검사기가 잡아야 한다.
function parseConfig(text) {
  const cfg = { scalars: {}, phases: [] };
  for (const l of text.split(/\r?\n/)) {
    const m = l.match(/^([A-Za-z_][\w-]*):\s*(.+)$/);
    if (m) cfg.scalars[m[1]] = m[2].replace(/\s+#.*$/, "").trim();
    const d = l.match(/^\s*-\s*(.+?)\s*$/);
    if (d) cfg.phases.push(d[1].replace(/\s+#.*$/, "").trim().toUpperCase()); // ← drift: A 는 소문자, B 는 대문자
  }
  return cfg;
}
if (process.env.PARSECONFIG_DUMP) {
  process.stdout.write(JSON.stringify(parseConfig(readFileSync(process.env.PARSECONFIG_DUMP, "utf8"))));
  process.exit(0);
}
