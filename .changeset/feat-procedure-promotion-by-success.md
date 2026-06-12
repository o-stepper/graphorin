---
'@graphorin/memory': minor
'@graphorin/store-sqlite': minor
'@graphorin/core': patch
---

MCON-2 (part 4): promotion-by-demonstrated-success for induced
procedures. `ProceduralMemory.recordOutcome(scope, id, succeeded)`
increments the rule's persistent `successCount` (migration 020,
`rules.success_count`) on each verified successful reuse; with
`createMemory({ procedurePromotion: { afterSuccesses: k } })` a
QUARANTINED procedure that reaches k successes is promoted into
`activate()` — the injection gate still refuses flagged texts
(`refused: true`) no matter how many successes accumulate. Fully
offline and opt-in: without the config outcomes are counted but
nothing auto-promotes. `Rule.successCount?` surfaces the counter.
