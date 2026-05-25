---
'@graphorin/core': patch
'@graphorin/store-sqlite': patch
'@graphorin/memory': patch
---

P2-1 — lightweight in-SQLite entity/relation graph + one-hop expansion
(see `memory-improvement-proposals.md` §5, summary-table row **P2-1 ·
Lightweight in-SQLite entity graph + one-hop CTE**). Activates the
dormant `(subject, predicate, object)` substrate — the columns + index
have existed since migration 001 but the write path nulled them — so
multi-hop recall ("what did the person I met in Tbilisi recommend?") can
traverse relationships instead of fragmenting them, all without leaving
SQLite (no graph DB). All changes are additive ⇒ `patch` (pre-1.0).

- **s/p/o is no longer inert.** `Fact` gains optional `subject` /
  `predicate` / `object` (`@graphorin/core`); the default
  `@graphorin/store-sqlite` adapter binds + surfaces them (it used to
  write `null`), and `SemanticMemory.remember(...)` carries them onto the
  persisted fact. Plain free-text writes are unchanged (s/p/o absent).
- **Canonical entities with auditable, reversible merges.** Migration
  **016** adds `entities` (with a partial-unique canonical index +
  name-embedding BLOB), `fact_entities`, and an append-only
  `entity_merges` ledger, exposed as the adapter's optional `graph`
  capability (`GraphMemoryStoreExt`). A merge sets a single-level
  `merged_into` pointer + records an audit row; unmerge reverses it.
  `fact_entities` is never rewritten — reads canonicalise through
  `merged_into`.
- **Entity resolution** (`@graphorin/memory/graph`): a provider-agnostic
  pure policy (`resolveEntityDecision`: lexical exact → embedding cosine
  → ambiguous band → new) + an `EntityResolver` that wires it to the
  store + embedder. **Offline-first and conservative**: the ambiguous
  similarity band mints a *new* entity by default (never auto-merges on
  weak evidence — a wrong merge fuses two distinct people); LLM
  adjudication of the band is a further opt-in needing a provider. With
  no embedder it degrades to lexical-only.
- **One-hop expansion behind an opt-in search option.**
  `SemanticMemory.search(..., { expandHops: 1 })` seeds on the
  lexical/vector candidates and fuses in facts sharing a canonical entity
  via a recursive CTE, surfacing connected facts the query never matched.
  `0` (the default) or a graph-less adapter ⇒ a silent no-op; recall is
  unchanged.
- **Wiring** (opt-in): `createMemory({ graph: { entityResolution: true } })`
  builds the resolver (requires a graph-capable adapter) so writes link
  entities. Omitted ⇒ the write path stays offline + behaviourally
  unchanged.

The default code path remains fully offline and byte-for-byte unchanged:
s/p/o is just carried, entity resolution and one-hop expansion are both
opt-in, and LLM adjudication is double-gated (provider + flag).
