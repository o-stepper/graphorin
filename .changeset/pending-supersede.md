---
'@graphorin/memory': minor
'@graphorin/store-sqlite': patch
---

W-019: supersede defers the old fact's interval closure until the quarantined successor is validated.

Previously a reconcile 'update'/'conflict' closed the ACTIVE fact's validity interval immediately while the extraction-provenance successor landed quarantined - default recall then returned NOTHING for that knowledge until (if ever) a manual `fact_validate`. Now: when the successor is quarantined, `SemanticMemory.supersede` records the link (`supersedes` on the successor, no schema change) and leaves the old fact recall-visible; `validate()` completes the closure on promotion (idempotent via the store's COALESCE upsert). `supersede` gains an `options.autoPromoteSynthesized` parameter and the standard phase threads `autoPromoteExtraction` through the update/conflict routes (the documented contract of the flag - previously only 'add' honoured it), restoring immediate closure for injection-clean successors when opted in. The deep phase links a quarantined judge-winner via the new optional `SemanticMemoryStoreExt.linkPendingSupersede` (implemented by store-sqlite) instead of closing the interval. Security posture unchanged: auto-activating successors would hand a MINJA attacker instant active memory, so old-visible-until-validated is the chosen trade-off. BEHAVIOR CHANGE: until validation, recall returns the OLD fact (previously: nothing).
