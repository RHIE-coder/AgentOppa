# phases.md — phase 데이터 모델 (스키마)

phase 한 장이 *어떻게 생겼는지*만 정의한다. **구체 phase(spec·review…)는 여기 없다** → 유저 프로젝트의 `.harness/project/phases/<name>.md`. 어떻게 이어지는지는 `contract.md`, 어떤 순서·옵션인지는 `recipe.md`.

## phase = frontmatter(구조) + 본문(산문)

기계가 읽는 구조는 **frontmatter**(`---` 사이), 사람·AI가 읽는 지시는 **본문**. (생성될 스킬도 같은 모양이라, 컴파일이 곧 슬롯 채운 frontmatter 변환.)

```yaml
---
name:     spec                # 소문자-하이픈. id → /spec 스킬
desc:     "요구를 검증가능한 명세로 굳힐 때. 인수조건·범위가 박힌 spec 반환."  # 언제 쓰나(트리거) front-load
when:     "<조건>"            # (선택) 이때만 실행. 없으면 항상. → 본문 맨 위 self-gate로 컴파일
consumes: [requirements?]     # 입력 산출물(의존). ?=선택. [] = 시작 단계
produces: spec                # 출력 산출물 role. 없거나 ~ = 문서 안 남김(코드/상태만)
gate:     "spec.md status=ready · 인수조건 ≥1"   # done 조건(좋은 산출물의 정의). sync로 강제
needs:    [test_command?]     # (선택) 필요한 프로젝트 값/도구. config.values·면담이 채움
tier:     standard            # (선택) cheap|standard|strong. recipe.routing과 곱해 모델 결정
workers:                      # (선택) 부릴 보조 에이전트 + 선택 규칙. 없으면 블록째 생략
  select: dynamic             #   all | none | dynamic
  options:
    <agent-name>: "<언제 띄울지>"
---
입력 {역할}을 읽는다.
1. <명령형 지시>
산출 {역할} (헤더 phase: <name>). → {next}
```

## 필드 (무엇 → 컴파일되면)

| 키 | 뜻 | 컴파일되면 |
|---|---|---|
| `name` | id | `/name` 스킬 |
| `desc` | *언제 쓰나*(트리거) front-load (절차 요약 ❌) | 스킬 `description` (에이전트가 호출 판단) |
| `when` | (선택) 실행 조건 | **본문 맨 위 self-gate** (불충족 → `{next}`로 건너뜀) |
| `consumes` | 받는 산출물 role (`?`=선택) | 본문 입력 `{역할}` |
| `produces` | 남기는 산출물 role (`~`=없음) | 산출물 문서(헤더) |
| `gate` | done 조건 | `sync=strict`면 게이트 훅 |
| `needs` | (선택) 프로젝트 값/도구 | 본문 `{프로젝트값}`; validate가 제공 점검 |
| `tier` | (선택) 모델 horsepower | `routing`과 곱해 모델/effort → ccc-agents |
| `workers` | (선택) 보조 에이전트 + 조건 | 서브에이전트 스폰 (정의는 `agents/<name>.md`) |

> `consumes`/`produces`는 **문서 바통만** 적는다 — 코드는 산출물이 아니라 작업 트리(본문에서 `git diff` 등으로 직접 읽음). role이 *어떤 파일로* 풀리는지는 `contract.md`.

## "조건"이 3종류 — 헷갈리지 말 것

| 무엇 | 언제 판단 |
|---|---|
| `when` | 이 phase를 **돌릴까?** (입구 — self-gate) |
| `gate` | 이 phase가 **끝났나?** (출구 — sync가 강제) |
| `workers.options` | phase 안에서 **어떤 보조를 띄울까?** (실행 중) |

## 본문 슬롯 (컴파일 때 채워짐)

| 슬롯 | 채워지는 값 | 해석 주체 |
|---|---|---|
| `{역할}` (예 `{spec}`) | 산출물 경로 `.harness/artifacts/{feature}/spec.md` | contract |
| `{next}` | 다음 phase (`/tdd` 등) | recipe (순서 — phase는 자기 다음을 모름) |
| `{프로젝트값}` (예 `{테스트 명령}`) | `config.values` / 면담 값 | recipe·면담 |

## self-gate — `when`이 런타임 엔진 없이 도는 법

`when:`을 외부 오케스트레이터가 판단하면 = 우리가 안 만드는 런타임 엔진. 대신 컴파일 때 **스킬 본문 맨 위**에 자가 점검으로 박힌다:

```text
이 단계는 <when 조건>일 때만 한다. 아니면 아무것도 하지 말고 바로 → {next}.
( 본 지시 … )
```

→ 그 스킬이 불릴 때 *스스로* 조건을 보고 건너뛴다. 로직이 스킬 안에 = 베팅(엔진 없음) 유지. (`when` 없으면 = 항상 실행.)

## phase가 컴포넌트로 펼쳐지는 규칙

| phase에 …가 있으면 | 만들어지는 것 | 메이커 |
|---|---|---|
| 항상 | phase 스킬 | ccc-skills |
| `workers` | 서브에이전트 (`agents/<name>.md` → `.md`/`.toml`) | ccc-agents |
| `gate` + `sync=strict` | 게이트 훅 | ccc-hooks |
| `produces` | 산출물 문서(헤더 포함) | ccc-memory |

---

*실제 phase 모음은 유저의 `.harness/project/phases/`. 빈 골격은 `../template.md`, 견본은 `examples/sample.md`. (AgentOppa는 phase를 샘플로 싣지 않는다 — phase는 프로젝트에서 온다.)*
