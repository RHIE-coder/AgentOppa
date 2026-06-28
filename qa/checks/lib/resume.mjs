// qa/checks/lib/resume.mjs — "resume_equivalent" 판정의 순수 로직 (fs 무관, 결정적).
//   베팅: "런타임 엔진 없음 → 상태 = 커밋된 문서 → 중단/재개가 무중단과 *같은 산출 구조*를 낸다."
//   동등의 정의(기계화 가능한 근사): 내용 텍스트가 아니라 *구조* 가 같다 —
//     (1) 역할 집합 동일(재개본이 빠뜨리거나 더하지 않음), (2) 인계 순서 동일, (3) 재개본 각 문서가 유효 헤더.
//     내용 텍스트는 비교하지 않는다 — LLM 생성이라 문장은 매번 달라도, "이어서 같은 단계를 같은 순서로
//     같은 역할의 산출로 냈다"가 베팅의 본질. (라이브 2-run *수집* 은 세션이 몬다 — 여긴 *판정* 로직만.)
//   입력: baseline/resumed = [{ role, hasHeader, header }] (각 산출 세트, 인계 순서대로).
//   호출자(run.mjs JUDGE / standalone validator)가 두 세트를 읽어 이 함수에 넘긴다.

export function judgeResumeEquivalent(baseline, resumed) {
  const fails = [];
  if (!baseline.length) return { ok: false, msg: "무중단(baseline) 산출 0개 — 비교 기준이 없음" };
  if (!resumed.length) return { ok: false, msg: "재개(resumed) 산출 0개 — 재개가 아무것도 이어가지 못함" };

  const bSeq = baseline.map((d) => d.role), rSeq = resumed.map((d) => d.role);
  const bSet = new Set(bSeq), rSet = new Set(rSeq);

  // (1) 역할 집합 동일 — 재개본이 중단 전 단계를 빠뜨리거나, 무중단엔 없던 걸 더하면 안 된다.
  const missing = [...bSet].filter((r) => !rSet.has(r));
  const extra = [...rSet].filter((r) => !bSet.has(r));
  if (missing.length) fails.push(`재개본이 누락한 산출: [${missing.join(", ")}] (중단 전 단계를 이어가지 못함)`);
  if (extra.length) fails.push(`재개본에만 있는 산출: [${extra.join(", ")}] (무중단엔 없던 것)`);

  // (2) 인계 순서 동일 — 집합이 같을 때만 의미 있다.
  if (!missing.length && !extra.length && bSeq.join(">") !== rSeq.join(">"))
    fails.push(`인계 순서 다름: 무중단 [${bSeq.join(" → ")}] vs 재개 [${rSeq.join(" → ")}]`);

  // (3) 재개본 각 문서가 유효 헤더 — 중단으로 깨진 반쪽(미완결) 산출을 거른다.
  for (const d of resumed)
    if (!d.hasHeader) fails.push(`재개본 '${d.role}.md' frontmatter 헤더 없음 (중단으로 미완결?)`);

  return fails.length
    ? { ok: false, msg: `resume 비동등:\n      ${fails.join("\n      ")}` }
    : { ok: true, msg: `resume 동등 — 역할 ${bSeq.length}개 집합·순서 일치, 재개본 전부 유효 헤더 (중단 ≡ 무중단)` };
}
