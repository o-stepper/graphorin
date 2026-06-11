---
'@graphorin/cli': patch
---

feat(cli): `graphorin memory review` — quarantine review + promotion (MCON-2, part 2)

Adds the operator review surface for the quarantine lifecycle. `graphorin memory
review` lists everything the consolidator left quarantined across all four tiers
(facts, episodes, insights, induced procedures), reading the store directly with
no embedder. `--promote <id>` promotes a reviewed item out of quarantine,
routed through the tier `validate(...)` — so an injection-flagged memory is
**refused** unless the operator passes `--force` from a trusted context after
review (the same gate the agent faces). `--reason` records an audit reason;
`--json` emits a structured document.

Promotion is deliberately per-id after a batch review rather than a
"promote-everything" sweep: blind batch promotion of quarantine would defeat the
injection gate. Covered by a real-sqlite CLI test (list every tier; promote a
clean item; refuse an injection-flagged procedure without `--force` and promote
it with it).
