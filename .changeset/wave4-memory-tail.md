---
'@graphorin/memory': minor
---

Wave-4 memory tail (low-severity):

- **MST-11** — entity resolution no longer compares embeddings across embedders. `resolveEntityDecision` gains `ResolutionCandidate.embedderId` + `ResolveDecisionInput.vectorEmbedderId`, and skips any candidate whose embedder differs from the query vector's embedder (different models occupy different vector spaces, so their cosine is meaningless). `EntityResolver` passes its current embedder id through. Absent ids on either side ⇒ compared, byte-identical to prior behaviour.
- **MST-12** — embedder-migration honesty. Corrected docstrings/errors that promised unbuilt plumbing: the `nextBatch` hook is **caller-supplied** (no store-side auto-wiring), and there is no persisted `migration_state` cursor — an aborted migration restarts from the beginning rather than "resuming from the persisted cursor".
