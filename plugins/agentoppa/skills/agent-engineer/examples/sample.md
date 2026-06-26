# examples/sample.md — 생성된 하네스 견본 (`.harness/` dev-flow)

`dev-flow`(spec→tdd→review)를 OAuth 로그인에 깐 한 벌. 새 하네스의 목표 형식.

## 0. 면담 (요약)

유저: "OAuth 로그인 흐름 세팅." → spec 짧게 · 바로 TDD · 리뷰는 보안 중요 · 병렬 X → `dev-flow`에서 시작.

## 1. SOURCE 트리 (`.harness/` — 유저가 손대는 곳)

```
.harness/
├── config.yaml
├── intent.md
├── core/validate.mjs
├── project/
│   ├── phases/{spec,tdd,review}.md
│   └── agents/{code-reviewer,security-reviewer}.md
└── artifacts/login-oauth/         (실행하며 쌓임 + lock.json)
```

## 2. `config.yaml`

```yaml
harness:  dev-flow
feature:  login-oauth
sync:     medium
routing:  balanced
phases:
  - spec
  - tdd
  - {name: review, sync: strict}    # 보안 중요 → 이 단계만 strict
values:
  test_command: "npm test"
```

## 3. phase 소스 — `project/phases/spec.md` (frontmatter + 본문)

```markdown
---
name: spec
desc: 요구를 검증가능한 명세로 굳힐 때. 인수조건·범위가 박힌 spec 반환.
consumes: []
produces: spec
gate: "spec.md status=ready · 인수조건 ≥1"
tier: standard
---
입력 요구를 확인한다.
1. 문제 · 범위 · 비범위.
2. 검증가능한 인수조건 목록.
산출 {spec}. → {next}
```

## 4. 컴파일 결과 — `plugins/<harness>/skills/spec/SKILL.md` (슬롯 박힘 → AgentOppa-독립)

```markdown
---
name: spec
description: 요구를 검증가능한 명세로 굳힐 때. 인수조건·범위가 박힌 spec 반환.
---
입력 요구를 확인한다.
1. 문제 · 범위 · 비범위.
2. 검증가능한 인수조건 목록.
산출 .harness/artifacts/login-oauth/spec.md (헤더 phase: spec). → /tdd
```

`{spec}` → `.harness/artifacts/login-oauth/spec.md`, `{next}` → `/tdd` 로 채워짐.

## 5. 산출물이 흐른다 (바통)

```
/spec   → spec.md                       (status: ready)
/tdd    → (spec.md 읽음) → 코드+테스트     (produces: ~, 문서 없음)
/review → (코드 diff + spec.md 읽음) → review.md
```

`review.md` 헤더: `phase: review` · `status: ready` · `inputs: [spec]`.

## 6. review가 보조 에이전트를 고르는 순간

`git diff`에 `src/auth/` 변경 O, 화면 X → code-reviewer ✅ · security-reviewer ✅ · ui-reviewer ❌. 둘만 병렬 read-only로 띄워 `review.md`에 합본.
(에이전트 본체는 `project/agents/<name>.md`, 컴파일 → 공유 `plugins/<harness>/agents/<name>.md` + 빌드된 `.toml`.)

## 7. 검사

```bash
node .harness/core/validate.mjs
```

연결(spec→tdd→review)·신선도(lock)·strict 게이트(review) 점검.

---

**포인트:** phase 소스(`.harness/project/phases/`)는 그대로, **슬롯만 config·contract로 채워져** `plugins/<harness>/` 공유 트리(+두 매니페스트)로 컴파일된다. 다른 흐름이면 `config`의 `phases`만 바꾸면 끝.
