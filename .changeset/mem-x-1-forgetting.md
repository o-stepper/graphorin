---
'@graphorin/core': patch
'@graphorin/store-sqlite': patch
'@graphorin/memory': patch
---

X-1 — multi-signal forgetting / capacity-bounded eviction (see
`memory-improvement-proposals.md` §5, summary-table row **X-1 ·
Forgetting/eviction refinement (cost hygiene)**). Decay was single-signal
(recency via `strength`) and there was no capacity bound, so storage and
retrieval cost grew unbounded. This adds a multi-signal salience score and an
opt-in capacity bound that trims the lowest-salience facts to the recoverable
archive tier. **Positioned as cost / staleness control, not an accuracy
lever** — the research found little benchmark evidence that decay improves QA
accuracy, and salience never gates recall. All changes are additive ⇒ `patch`
(pre-1.0).

- **Multi-signal salience** (`@graphorin/memory`): new pure `salience(...)`
  combines the existing Ebbinghaus `retention` curve (temporal relevance +
  access frequency via `strength`) with the **P1-2 importance hint** and a
  **P1-4 security-risk negative term** — a quarantined fact takes a strong
  penalty (evicted first), foreign provenance a mild one. With neutral
  importance, an active status, and first-party provenance the factors are all
  `1`, so `salience === retention` and pre-X-1 behaviour is unchanged. New
  `SalienceWeights` type + `DEFAULT_SALIENCE_WEIGHTS` / `NEUTRAL_IMPORTANCE`
  constants, and a pure `selectForCapacityEviction(scored, capacity)` priority
  selector (lowest salience first, ties broken by id).
- **Capacity-bounded eviction** (`@graphorin/memory`): the light phase now
  scores each fact in the LRU decay window by salience, archives those below
  the threshold (`low_salience`), then — when the new `decayCapacity` is set —
  archives the lowest-salience survivors (`capacity_exceeded`) until the window
  fits. Archiving is the existing **soft, recoverable** move (`archived = 1`,
  never `deleted_at`); nothing is hard-deleted. `decayCapacity` defaults to
  `null` (unbounded) at every tier, so it is strictly opt-in. New
  `ConsolidatorConfig.decayCapacity` / `.salienceWeights` (+ matching
  `createConsolidator` / `createMemory` options) and a
  `consolidator.light.capacity_evicted` span attribute.
- **Per-fact importance** (`@graphorin/core` + `@graphorin/store-sqlite`):
  migration **015** adds the `facts.importance REAL` column deferred from P1-2,
  `Fact.importance?` (an optional `[0, 1]` salience hint) is added to core, and
  `listForDecay` now surfaces `importance` / `status` / `provenance` so the
  salience score can read them. Importance is a *soft* signal: `NULL` (unscored)
  is treated as the neutral midpoint, so existing rows are unaffected.

Capacity is enforced per light-phase pass over the LRU decay window (widened
past the batch size when a bound is set), so the live count converges toward
`decayCapacity` over repeated passes rather than in a single sweep.
