---
name: spec
desc: 더할 기능을 검증가능한 명세로 굳힐 때. 인수조건·범위·비범위가 박힌 spec 반환.
consumes: []
produces: spec
gate: "spec.md status=ready · 인수조건 ≥1"
---
더하려는 기능 요청을 확인해 검증가능한 명세로 굳힌다.
1. 문제 · 대상 모듈 · 범위 · 비범위(무엇은 안 한다).
2. 새 동작의 검증가능한 인수조건을 나열한다.
산출 {spec} (헤더 phase: spec). → {next}
