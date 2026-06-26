---
name: test
desc: 테스트로 검증할 때.
consumes: [spec]
produces: test
needs: [test_command]
gate: "{test_command} 전체 green"
---
{spec} 기준 테스트를 쓴다. {test_command} 로 확인. 산출 {test}.
