---
'@graphorin/memory': patch
---

fix(memory): close the one-turn memory-poisoning chain via fact_validate (MRET-3/MST-1)

A quarantined, injection-flagged fact could be promoted into action-driving
recall by the model itself in a single turn: `fact_remember(poison)` returned
the new fact's id without signalling the quarantine, and `fact_validate`
(in the default model toolset, no approval) blindly promoted it. Two gates
now close this:

- `fact_validate` is `needsApproval: true` — the run suspends for a human
  decision before any promotion executes.
- `SemanticMemory.validate(...)` re-checks the fact's text against the
  offline injection heuristics and refuses an injection-flagged row with the
  new `QuarantinePromotionRefusedError`. Synthesized-but-clean consolidator
  writes still promote; an injection-flagged fact is an operator-only
  decision requiring an explicit `{ force: true }` from a trusted (non-agent)
  caller. `validate(...)` gains an optional fourth `{ force }` argument.

`fact_remember`'s output now reports `quarantined` and a `quarantineReason`
(`injection` / `synthesized`) so a poisoned write cannot pass for a normal
one. `RememberOutcome` carries the same `quarantineReason`.
