---
'@graphorin/agent': minor
'@graphorin/memory': minor
---

feat(agent): manual `agent.compact()` splices through the run loop (CE-3 / AG-13)

`agent.compact()` used to pay for the summarizer LLM call and then throw the
result away: `trimmedMessages` were never written back into the live buffer, so
the next provider request still carried the full history. It now routes through
the loop — the request is enqueued and serviced at the next step boundary with
the **same prefix-pinned splice** as auto-compaction, emitting
`context.compacted` with `source: 'manual'` (or your `'pre-step'`).

- `CompactOptions.preserveRecentTurns` is forwarded to the engine as a per-call
  strategy override (previously accepted and ignored).
- `CompactionApiResult` gains `applied: boolean` and `skippedReason`
  (`'no-memory' | 'no-active-run' | 'nothing-to-trim' | 'sensitivity-gated'`) —
  idle calls resolve an explicit no-op instead of silent zeros.
- `hooksFiredCount` now reports the number of post-compaction hooks that fired
  (it previously reported the count of re-injected content parts).
- The WI-09 `'secret'`-sensitivity gate now applies to manual compaction too:
  secret-tier history never ships to the summarizer.
- Requests left unserviced when the run ends settle as
  `applied: false, skippedReason: 'no-active-run'`.

`@graphorin/memory`: `ContextEngine.compactNow` accepts two new optional
per-call fields — `preserveRecentTurns` (strategy override for the
`summarize-old-preserve-recent` strategy) and `procedural` (`{ topic?, tags? }`,
threaded into `HookDeps.procedural` so the built-in project-rules re-anchor hook
can narrow `memory.procedural.activate(...)`, CE-6 item 3).
