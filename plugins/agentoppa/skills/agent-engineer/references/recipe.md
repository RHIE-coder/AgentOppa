# recipe.md — Config (어떤 phase를 어떤 순서·강도로)

Config = **진실원천.** 고른 phase·순서·강도를 `.harness/config.yaml`에 적어 git 커밋한다. AgentOppa(Maker)이 이걸 읽어 phase 스킬들로 컴파일한다. phase 양식은 `phases.md`, 잇는 규칙은 `contract.md`.

## config.yaml 양식

```yaml
harness:  dev-flow            # 이 하네스 이름
feature:  login-oauth         # 작업 스코프 (역할→경로의 {feature}); 생략 시 git 브랜치
sync:     medium              # loose | medium | strict (전역 기본)
routing:  balanced            # budget | balanced | premium (모델)
phases:                       # 순서 = 흐름. 각 이름 → project/phases/<name>.md
  - spec
  - tdd
  - review
values:                       # (선택) phase의 needs / {프로젝트값}을 채움
  test_command: "npm test"
```

- `phases`의 **순서**가 각 phase 본문의 `{next}`를 채운다 (phase는 자기 다음을 모름).
- 이름은 `.harness/project/phases/<name>.md`로 푼다. 없으면 → Maker가 `phases.md` 양식대로 *즉석 저작*해 거기 둔다.
- `values`는 phase의 `needs`가 가리키는 프로젝트 값. 면담에서도 채워진다.

## loop — 유일한 비선형 장치

반복(비평↔수정 등)은 `loop` 블록:

```yaml
phases:
  - ui-analyzer
  - loop:
      do:    [ui-critic, ui-implement]   # 이 묶음을
      until: "ui-critic가 '기준 충족' 판정" # 이 조건까지 반복
      max:   5                           # 안전장치
```

`loop` 밖은 전부 일렬. **중첩 loop는 v1 금지**(validate가 막음).

## sync — 게이트 강도 (전역 + phase별 오버라이드)

phase의 `gate`(done 조건)를 얼마나 세게 강제할지:

| 값 | 게이트가… | 만들어지는 것 | 에이전트 |
|---|---|---|---|
| `loose` | 본문 안내만 | 훅 없음 | 자율 진행 |
| `medium` | 위반 시 경고(진행 가능) | validate 소프트 체크 | 경고 보며 진행 |
| `strict` | 미충족이면 다음 진입 **차단** | ccc-hooks가 게이트 훅 | 충족해야 넘어감 |

전역 `sync`가 기본. **phase별로 덮을 수 있다** — `phases` 항목을 맵으로:

```yaml
sync: medium                     # 전역 기본
phases:
  - brainstorm                   # 전역 따름(medium)
  - spec
  - {name: review, sync: strict} # 이 단계만 강하게
```

(`phases` 항목은 **이름 | {name, sync?} | loop** — validate가 셋 다 받음.)

## routing — 모델 (tier × routing)

phase의 `tier`(cheap·standard·strong) × config의 `routing`(budget·balanced·premium)이 **단계마다 모델/effort를 결정**한다:

| tier ＼ routing | budget | balanced | premium |
|---|---|---|---|
| cheap | 최저 | 최저 | 표준 |
| standard | 최저 | 표준 | 강 |
| strong | 표준 | 강 | 최강 |

"최저~최강"의 실제 모델·effort 매핑 + Codex 변환은 **ccc-agents**가 한다. Maker는 *의도(tier)*만 싣는다.

---

(phase는 프로젝트의 `project/phases/`에서 온다 — AgentOppa는 샘플/프리셋을 싣지 않는다. 순서·강도까지가 여기, 컴파일 결과를 양쪽 도구로 묶는 포장은 `ccc-plugin`.)
