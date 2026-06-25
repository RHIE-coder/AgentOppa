# template.md — 빈 의도 정리 골격 (복사용)

아래 코드블록을 `.harness/intent.md`로 복사해 `<…>`를 채운다. 채운 뒤 안내는 지운다. 양식·연결 규칙은 [references/handoff.md](references/handoff.md), 채우는 방법은 [references/method.md](references/method.md).

````markdown
---
phase:  intent-interview
status: draft            # 확신 판정 통과 + 막힌 것 없음이면 ready
inputs: []
---
# Intent: <한 줄 의도 요약>

## 목표
- <결과로 적는다. "되면 뭐가 달라지나">

## 범위
- 할 것(in): <…>
- 안 할 것(out): <명시적으로 안 할 것>

## 제약
- <도구·시간·기존 것·꼭/절대>

## 예시 / 반례
- 좋은 사례: <…>
- 싫은 사례: <…>

## 우선순위
1. <가장 중요>
2. <…>

## 내린 결정
- <질문> → <합의된 답> (<왜>)

## 미해결
- 차단: <없으면 "없음">
- 비차단: <나중으로 미뤄도 되는 것>

## 확신
- 필수 항목 구체 답: <예/아니오>
- 구체 예시 확보: <예/아니오>
- 결과 가르는 미지수 없음: <예/아니오>
- 마지막 되짚어 확인에 정정 없음: <예/아니오>
- 한 줄 테스트: <"만드는 사람이 진짜 원한 걸 만든다"에 자신 있나>

## 하네스 힌트
- 작업 묶음: <기획·개발·화면·병렬 등 제안>
- 분야: <…>
- sync: <loose | medium | strict>
- routing(모델 등급): <budget | balanced | premium>
````
