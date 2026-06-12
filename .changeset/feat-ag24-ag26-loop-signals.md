---
'@graphorin/core': minor
'@graphorin/agent': patch
---

feat(agent): stop-condition cuts are typed failures; ghost tool-call-ends dropped; provider file/source surfaced (AG-24, AG-26)

- AG-24: a run cut by its stop condition (default `isStepCount(50)`) used to
  end `status: 'completed'` — indistinguishable from a clean finish. It now
  ends `status: 'failed'` with `error.code: 'stop-condition'` and the
  condition's description, plus an `agent.error` event.
- AG-26: a provider `tool-call-end` with no matching `tool-call-start` was
  dispatched as the unknown tool `''`; it is now dropped with a stderr warn.
- AG-26: provider `'file'` / `'source'` stream events were silently
  discarded; they now surface as the new core `AgentEvent` variants
  `file.generated` (`{ mimeType, data }`) and `source.cited`
  (`{ uri, title? }`).
