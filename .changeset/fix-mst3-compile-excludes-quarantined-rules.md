---
'@graphorin/memory': patch
---

fix(memory): exclude quarantined procedures from `compile()` (MST-3)

`facade.compile()` rendered **every** procedural rule returned by
`store.procedural.list(scope)` into the `<memory_rules>` system-prompt block
with no status filter, while `procedural.activate()` correctly excludes
quarantined rules. So a `compile()`-based prompt builder ingested unvalidated,
still-quarantined **induced** procedures (P2-2 — the highest memory-poisoning
risk) straight into a system-role message, contradicting the activation gate.

`compile()` now filters `rule.status !== 'quarantined'`, exactly mirroring
`activate()`. `list()` is unchanged (it still surfaces quarantined rules for the
review / inspector path). Regression test: a quarantined rule no longer appears
in `<memory_rules>` while an active one still does.
