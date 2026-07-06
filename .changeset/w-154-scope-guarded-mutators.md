---
'@graphorin/core': minor
'@graphorin/memory': minor
'@graphorin/store-sqlite': minor
---

Store mutation paths gain scope-guarded variants, symmetric with the read-side isolation (W-154): every read binds `scope_user_id`, but `forget`, `setStatus` (facts/episodes/rules/insights), `archive`, `archiveFact`, `purge`, and `markAccessed` operated on the bare id - code holding a leaked or cross-user id could quarantine, archive, or hard-purge another user's memory. All mutators now accept an optional trailing `scope?: SessionScope` (additive; existing adapter implementations stay structurally compatible): when supplied, a non-owned row is a deterministic silent no-op - a scoped `purge` of a foreign id writes nothing at all, not even the PURGE audit row. The `@graphorin/memory` tiers pass their scope through on `validate`/`forget`/`purge`/`archive` and the recall `markAccessed` path; the consolidator and erasure cascades deliberately keep calling unscoped.
