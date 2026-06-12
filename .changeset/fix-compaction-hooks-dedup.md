---
'@graphorin/memory': minor
---

CE-6 / CE-7 / CE-14: the compaction pipeline tells hooks the truth and
stops double-counting preserved turns.

- Post-compaction hooks receive the REAL `PostCompactionHookContext`
  (result / runId / sessionId / agentId / source) — the engine used to
  build it and `void ctx;`-discard it while the function-form wrapper
  fabricated a zeroed result with `source: 'manual'` unconditionally.
  A function hook invoked outside `compactNow` now throws instead of
  silently seeing zeros.
- The in-buffer summary's "Recent turns preserved verbatim" section
  renders one-line digests (120-char cap) instead of full verbatim —
  the preserved turns also live on as real messages after the splice,
  so verbatim rendering doubled them in the buffer and in
  `afterTokens`. `SUMMARY_TEMPLATE_VERSION` bumped to 1.1.
- Anti-thrash guard: when a compaction cannot get under the trigger
  threshold (oversized preserved turns), the immediate re-trigger is
  suppressed until the buffer grows past the last outcome, with a
  stderr warning — previously this thrashed by re-summarizing the
  previous summary.
- `droppedMessageIds` are prefixed with the compaction instant so they
  no longer collide across compaction events (core messages carry no
  id; the labels are documented as positional).
