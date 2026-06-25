# 견본 스킬 — `release-notes`

**잘 만든 스킬 하나의 전체 형태.** 새 스킬을 만들 때 형식·톤·길이의 목표로 삼는다. (실제 스킬은 `release-notes/SKILL.md` 한 파일로 존재한다 — 아래는 그 내용이다.)

````markdown
---
name: release-notes
description: 다음 릴리스의 변경 요약을 만들 때 사용. "릴리스 노트 써줘", "이번 배포 뭐 바뀌었어", "changelog 초안", "태그 이후 커밋 정리" 같은 요청. 마지막 태그~HEAD 커밋을 사용자 관점 항목으로 묶는다.
disable-model-invocation: true
allowed-tools: Bash(git *)
---

## 변경 내역
- 마지막 태그: !`git describe --tags --abbrev=0`
- 그 이후 커밋: !`git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:'- %s (%h)'`

## 할 일
위 커밋을 **사용자 관점**으로 분류해 릴리스 노트를 만든다:
1. `Added` / `Changed` / `Fixed` / `Removed`로 그룹화한다.
2. 각 항목은 내부 구현이 아니라 사용자가 체감하는 변화로 다시 쓴다.
3. 호환성 깨짐(breaking)은 맨 위에 ⚠로 표시한다.
4. 빈 구간이면 "릴리스할 변경 없음"이라고 답한다.
````

## 왜 이게 좋은 견본인가

- **description이 "언제"에 집중** — 트리거 문구를 앞에 두고 절차는 요약하지 않는다(본문을 읽게 만든다).
- **동적 컨텍스트 주입**(`` !`git …` ``) — 실제 diff/커밋이 본문에 이미 박힌 채로 도착한다. Claude가 추측하지 않는다.
- **본문이 짧고 명령형** — 호출 후 턴 내내 상주함을 의식한 길이.
- **`disable-model-invocation`** — 사람이 의도할 때만 발동(자동 남발 방지). 부작용/타이밍이 중요한 작업의 표준.
- **`allowed-tools`로 git만 사전승인** — 권한 프롬프트 최소화. 다른 도구는 제한되지 않는다.

## 도구별 주의

- `` !`command` `` 동적 주입과 `disable-model-invocation`은 **Claude Code 기능**이다.
- Codex에 같은 스킬을 노출하면, "자동발동 끄기"는 frontmatter가 아니라 `agents/openai.yaml`의 `policy.allow_implicit_invocation: false`로 표현한다. (`references/cross-tool.md` 참고.)
