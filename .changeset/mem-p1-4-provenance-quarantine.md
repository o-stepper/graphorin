---
'@graphorin/core': patch
'@graphorin/memory': patch
'@graphorin/store-sqlite': patch
---

P1-4 — memory safety: provenance, quarantine, trust tiers (see
`memory-improvement-proposals.md` §5, summary-table row **P1-4 · Memory safety:
provenance + quarantine + trust tiers**). The write-path safety gate that must
ship before/with the synthesized-memory write paths (P0-3 reconciliation, P1-1
reflection, P2-2 induction): long-lived memory is the prime target for
poisoning (MINJA, MemoryGraft), and an injected instruction planted today fires
weeks later when semantically recalled. No breaking changes — additive columns,
types, and tools; default reads are byte-identical when no quarantined rows
exist.

`@graphorin/core`: new `MemoryProvenance`
(`user`|`tool`|`extraction`|`reflection`|`imported`) and `MemoryStatus`
(`active`|`quarantined`) unions; `Fact` and `Episode` gain optional
`provenance?` + `status?`; `MemorySearchOptions` gains `includeQuarantined?`
(default `false`) alongside the existing `includeArchived`.

`@graphorin/store-sqlite`: migration `013-memory-provenance.sql` adds
`provenance` + `status` columns (with `idx_*_status` indexes) to `facts` and
`episodes` — every pre-existing row reads back `active` with NULL provenance.
Fact/episode `search` + `searchVector` exclude `status = 'quarantined'` by
default (a literal predicate, so absent ⇒ unchanged SQL); `searchVector` gains a
positional `includeQuarantined?` after `asOf`. New `setStatus(factId, status,
reason?)` flips retrieval-trust and writes a `memory_history` audit row
(`VALIDATE` / `QUARANTINE`) — quarantine never touches content / embedding /
tombstone.

`@graphorin/memory`: `FactInput` gains `provenance?`; `FactSearchOptions` gains
`includeQuarantined?`. `SemanticMemory.remember(...)` now *derives* `status` —
synthesized writes (`extraction` / `reflection`) and candidates that trip the
new offline, locale-aware injection heuristics
(`internal/injection-heuristics.ts`: ignore-previous-instructions, role-markup
smuggling, secrecy / exfiltration directives) land `quarantined` and are
excluded from default recall. The consolidator standard phase tags extracted
facts `provenance: 'extraction'`. New `SemanticMemory.validate(scope, factId,
reason?)` promotes a quarantined fact to active (audited); surfaced as the new
read-write `fact_validate` tool (appended last → canonical tool count
**ten → eleven**, original indices unchanged). `fact_search` output now carries
`provenance`. Also fixes a P0-2 export gap: `createFactHistoryTool` is now
re-exported from the package root.

All changes are additive and backward-compatible ⇒ `patch` (pre-1.0).
