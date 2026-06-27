---
id: case3b-idempotent
axis: adoption
seed: brownfield-oppa
agent_steps: [generate]
judge: [project_unchanged, compiled_idempotent]
tools: [claude]
---
# case3b-idempotent — 자기 산출 하네스 위에서 재실행(인식·비파괴)

**검증:** AgentOppa가 *자신이 전에 만든* 하네스가 있는 프로젝트에 다시 들어왔을 때, 인식하고 **멱등 재생성**(스퓨리어스 diff 0)·원본 무손상.
**fail:** 재생성이 Core 묶음(`.agentoppa/`)을 바꿈 / 원본 변형.
**판정:** 둘 다 기계.

## 절차 / 시드
`brownfield-oppa` = `brownfield-bare` + **AgentOppa가 생성해 커밋한 하네스**(Project `.harness/` + 재사용 Core `.agentoppa/`).
1. `setup` → baseline(커밋된 하네스 포함) → 2. `build-skills` 재실행(Core 재생성) → 3. `judge` (`compiled_idempotent`는 baseline 대비 `.agentoppa/` diff=∅ 검사).
