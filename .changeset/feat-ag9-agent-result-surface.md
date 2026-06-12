---
'@graphorin/core': patch
'@graphorin/agent': patch
---

feat(agent): `AgentResult` carries `status`, `error?`, and the final `state` (AG-9)

`agent.run()` returned only `{ output, usage }`: a failed run resolved with an
empty output and no signal, and a suspended run was indistinguishable from a
completed one — its resumable `RunState` was unreachable without configuring a
`checkpointStore`, even though the docs described the "operator persists the
suspended RunState from the previous run" pattern.

`AgentResult` now carries:
- `status` — the run's terminal `RunStatus` (`completed` / `failed` /
  `aborted` / `awaiting_approval`),
- `error?` — populated on failure (mirrors `RunState.error`),
- `state` — the final `RunState`; resumable when suspended (pass it back to
  `run`/`stream`, round-trip through `runStateToJSON`/`runStateFromJSON` for
  durability).

Failure semantics are now explicit and documented: `run()` **resolves** with
`status: 'failed'` + `error` (it does not reject on run failure — only on
config/usage errors thrown before the loop starts). The internal
`'' as unknown as TOutput` result seed is gone; `run()` throws on the
impossible no-result path instead of fabricating an empty success.
