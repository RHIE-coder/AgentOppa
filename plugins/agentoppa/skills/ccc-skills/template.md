# SKILL.md 빈 골격 (복사용)

아래 코드블록을 그대로 새 스킬의 `SKILL.md`로 복사하고 `<…>`를 채운다. 안내 주석(`#` / `<!-- -->`)은 채운 뒤 지운다. 규칙은 [`SKILL.md`](SKILL.md)와 [`references/`](references/)를 따른다.

````markdown
---
name: <skill-name>          # 소문자+숫자+하이픈. 디렉토리명과 동일. (Claude는 디렉토리명이 곧 /명령어)
description: <언제 쓰는지 한 줄 — 핵심 사용사례·트리거 단어를 앞에. "무엇을 하는가"가 아니라 "언제". 워크플로 요약 금지. ≤1,536자>
# --- 아래는 전부 선택 (필요할 때만 주석 해제) ---
# allowed-tools: Read Grep        # 권한 프롬프트 없이 쓸 도구 (제한이 아니라 사전승인)
# disable-model-invocation: true  # 자동발동 끄고 /name 수동 호출만 (배포·전송 등 부작용 작업)
# user-invocable: false           # / 메뉴에서 숨김, Claude 자동발동만 (순수 배경지식)
# model: inherit                  # 모델 오버라이드 (haiku/sonnet/opus/inherit)
# context: fork                   # 격리 서브에이전트로 실행 (작업형 스킬만; 지식형엔 무의미)
# agent: Explore                  # context: fork 일 때 사용할 에이전트
---

# <Skill Title>

## Overview
<이게 뭔지 + 핵심 원칙 1~2문장. 긴 배경은 references/로 뺀다.>

## When to use
- <발동 신호 · 증상 · 상황 · 사용자가 말할 법한 문구>
- **When NOT to use:** <적용 안 되는 경계 — 오발동 방지>

## Steps   <!-- technique형. 지식형이면 'Reference', 패턴형이면 'Core pattern' -->
1. <무엇을 할지 — 명령형, 간결>
2. ...

## Gate
- <전부 충족돼야 "done"으로 볼 조건 (테스트·검증 등)>

## Resources   <!-- 보조파일이 있을 때만 -->
- [references/<doc>.md](references/<doc>.md) — <상세 표준>
- 스크립트: `${CLAUDE_SKILL_DIR}/scripts/<tool>.mjs`   # 크로스플랫폼은 Node(.mjs) 권장; bash는 mac·linux 한정
````

## (선택) Codex에도 노출하려면 — `agents/openai.yaml`

같은 스킬 폴더에 두면 Codex가 UI 메타·발동 정책·의존성을 읽는다(Claude는 무시). 최소형:

```yaml
interface:
  display_name: "<표시 이름>"
  short_description: "<짧은 설명>"
  brand_color: "#5b4fd6"
  default_prompt: "<이 스킬을 부르는 기본 프롬프트>"
policy:
  allow_implicit_invocation: true   # false면 명시 호출($skill)만 (Claude의 disable-model-invocation 대응)
```

전체 키는 [`references/frontmatter.md`](references/frontmatter.md) 참고. 채운 뒤 `node scripts/validate.mjs <new-skill>/SKILL.md`로 점검한다.
