# template.md — 빈 골격 (복사용)

새 하네스를 만들 때 아래를 복사해 채운다. 규칙은 `references/phases.md`(phase)·`references/recipe.md`(Config)·`references/contract.md`(연결).

## 빈 Config — `.harness/config.yaml`

```yaml
harness:  <이름>
feature:  <작업 스코프>      # 생략 시 git 브랜치
sync:     medium             # loose | medium | strict (전역 기본)
routing:  balanced           # budget | balanced | premium
phases:
  - <phase>
  - <phase>
  # 반복:        - loop: { do: [<a>, <b>], until: "<조건>", max: 5 }
  # phase별 강도: - {name: <phase>, sync: strict}
values:
  <키>: "<값>"               # phase의 needs가 가리키는 프로젝트 값
```

## 빈 phase — `.harness/project/phases/<name>.md`

```markdown
---
name:     <소문자-하이픈>
desc:     "<언제 쓰나(트리거). 절차 요약 ❌>"
when:     "<조건>"          # (선택) 없으면 항상 실행
consumes: [<역할?>, ...]    # 없으면 [] (시작 단계)
produces: <역할>            # 없으면 ~ (코드/상태만, 문서 바통 없음)
gate:     "<done 조건>"     # (선택)
needs:    [<값?>, ...]      # (선택) config.values가 채움
tier:     standard          # (선택) cheap | standard | strong
workers:                    # (선택) 없으면 블록째 삭제
  select: all | dynamic | none
  options:
    <agent-name>: "<언제 띄울지>"
---
입력 {역할}을 읽는다.
1. <명령형 지시>
산출 {역할} (헤더 phase: <name>). → {next}
```

## 빈 보조 에이전트 — `.harness/project/agents/<name>.md` (workers가 참조할 때)

```markdown
---
name: <소문자-하이픈>
description: <무엇을 / 언제>
access: read-only           # 권한·도구
tier: standard              # (선택)
---
(스폰됐을 때 할 일 — 명령형)
```

슬롯: `{역할}`→경로(contract) · `{next}`→config 순서 · `{프로젝트값}`→config.values·면담.
채운 뒤 `node .harness/core/validate.mjs`로 점검한다.
