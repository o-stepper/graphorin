---
'@graphorin/agent': patch
---

fix(agent): toTool/handoff propagate context and surface failures (AG-17 / AG-22)

The two multi-agent boundaries dropped the parent context and swallowed
failures:

- **`Agent.toTool` (AG-17):** the sub-agent was invoked as a bare
  `run(input, {})` — no parent signal (abort could not stop it), no deps, no
  sessionId, and `inputFilter`/`secretsInheritance`/`inheritSecrets` were
  ignored while the README claimed least-authority enforcement. Now the parent
  `ToolExecutionContext` propagates (abort stops the sub-run, deps/sessionId
  flow through); `inputFilter` seeds the sub-agent with
  `[...filter(parentMessages), user(input)]` mirroring the handoff discipline;
  and a non-completed sub-run **throws** (tool error) instead of returning an
  empty-string success. The unimplemented `secretsInheritance`/`inheritSecrets`
  options are **deleted** — isolation at this boundary is structural (without a
  filter the sub-agent sees only the input string; no secret-inheritance
  mechanism exists), and the README/guide now say exactly that.
- **Handoff dispatch (AG-22):** the sub-agent stream now receives
  `{ signal, deps, sessionId }`; its terminal `agent.end` is observed so a
  failed/aborted handoff target surfaces as `tool.execute.error`
  (`execution_failed`/`aborted`) with an `Error:` tool message — never an empty
  success with `durationMs: 0` — and the recorded duration is real. The
  `HandoffRecord` secrets fields are documented as the structural truth (empty
  allowlist = nothing inherited, because no mechanism exists).
