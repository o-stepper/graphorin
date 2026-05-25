---
'@graphorin/memory': patch
'@graphorin/store-sqlite': patch
---

P0-3 — neighbour-aware write reconciliation, routed through bi-temporal
supersede (see `memory-improvement-proposals.md` §5, summary-table row **P0-3 ·
Neighbor-aware write reconciliation → bi-temporal supersede**). Replaces the
consolidator's "extract-blind-then-dedupe-by-heuristic" standard phase with
Mem0's **extract → reconcile** loop (arXiv:2504.19413): for each extracted
candidate the phase fetches the most-similar existing memories and lets one LLM
pass choose **ADD / UPDATE / NOOP / CONFLICT** *with the neighbours in view* —
then routes UPDATE/CONFLICT through a bi-temporal supersede (close the old
interval, insert the new) rather than a destructive delete (Zep's thesis; safer
than the systems it borrows from). All changes are additive / bug-fixing ⇒
`patch` (pre-1.0).

`@graphorin/memory`:
- New `ReconcileAction` + `ReconcileDecision` types and a
  `reconcileToConflictDecision` mapper (re-exported from the package root) that
  fold reconcile outcomes onto the existing `fact_conflicts` audit decisions
  (`add`→`admit`, `noop`→`dedup`, `update`/`conflict`→`supersede`) — no new
  stage or schema.
- New `SemanticMemory.neighbors(scope, text, { topK })` — raw vector KNN
  (no FTS / rerank / decay) that **includes quarantined facts** so prior
  synthesized memories are visible to reconciliation; returns `[]` when no
  embedder is configured.
- The standard phase now runs a cheap, LLM-free **pre-filter** (reusing the
  conflict pipeline's Stage 1 exact-dedup + Stage 2 embedding zones over the
  candidate's neighbours): clear hot/near-dup → `noop`, clearly cold / no
  neighbours → `add`, and only the ambiguous mid-zone spends a reconcile LLM
  call (budget-aware — an exhausted budget degrades to a safe `add`). Every
  decision is recorded to `fact_conflicts`; new facts respect the P1-4
  provenance/quarantine gate. With no embedder the phase degrades to the
  previous straight-through behaviour.

`@graphorin/store-sqlite`:
- `semantic.supersede(...)` now **closes the old fact's validity interval**
  (`valid_to = COALESCE(valid_to, <new fact's validFrom>)`) in addition to
  setting `superseded_by`, so point-in-time (`asOf`) queries stop returning a
  superseded fact once its replacement takes effect. Previously `valid_to` was
  left open forever, which broke `asOf(now)` after a supersede (a P0-2-flagged
  gap). `COALESCE` keeps it idempotent and never clobbers an explicitly-set
  close.
