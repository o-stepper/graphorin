---
'@graphorin/agent': minor
---

WI-09 / P1-1 — first-class context management in the run loop.

**Auto-compaction trigger.** When `config.memory` is wired, the runtime now
bounds context growth automatically. Before every `provider.stream(...)` call
it asks the memory `ContextEngine` whether the in-flight buffer has crossed the
per-provider threshold (`shouldCompact`); when it has, it summarises the older
turns (`compactNow`, `source: 'auto-trigger'`), splices the summary back over
them while keeping the most-recent turns verbatim, and emits the existing
`context.compacted` agent event. Compaction is configured on the memory facade
(`createMemory({ contextEngine: { compaction, providerContextWindow, summarizer } })`,
RB-46) — there is no parallel agent-level knob. The trigger is best-effort: a
misconfigured engine (e.g. no summarizer) is swallowed and the run proceeds
uncompacted rather than aborting mid-flight.

**KV-cache prefix stability.** The trusted system-prompt prefix (the leading run
of `system` messages pinned at run start) is never rewritten by compaction; only
the conversational body after it is summarised, so the prefix stays byte-stable
across steps and the provider cache breakpoint is real. Each compaction inserts
its summary *after* the prefix, where the next pass folds it into a fresh
summary-of-summary, so summaries never stack unbounded.

**Sensitivity gate.** A `sensitivity: 'secret'` run is never auto-compacted —
secret history is not shipped to a (potentially less-trusted) summarizer. The
full per-result handle/reference mechanism (P1-4) is tracked separately.

No-op without memory, below threshold, or for secret-tier runs, so the
happy-path `AgentEvent` stream is unchanged (R10). Post-compaction hook content
is re-injected as a trailing `system` message. Fully offline (R4).
