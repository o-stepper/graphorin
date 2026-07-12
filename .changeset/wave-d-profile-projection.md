---
'@graphorin/memory': minor
'@graphorin/store-sqlite': minor
'@graphorin/core': minor
---

Profile projection (wave-D D2, plan item 6). `createMemory({ profile: { topics?, maxSlots?, maxChars?, scope? } })` adds a deep-phase pass that projects ACTIVE facts (never quarantined, never W-019 pending-supersede - sourced via the new `listActive({ excludePendingSupersede: true })`) into the reserved `profile` working block as deterministic topic / sub-topic / content slots with fact-id provenance; hallucinated provenance references and out-of-taxonomy topics are dropped. The block is registered `readOnly: true` (agent `block_*` tools refuse writes - the consolidator is the single writer) and written USER-scoped by default: session deletion deliberately does not erase it, and the erasure path is the new hard-delete surface `memory.working.purge(userScope, 'profile')` (`WorkingMemoryStore.purge?` optional-additive on the core contract; `forget()` remains a soft tombstone). `PhaseOutcome.profileProjectionUpdated` reports rewrites; configuring `profile` without an enabled consolidator WARNs once. SpanType gains `memory.consolidate.profile-projection`.
