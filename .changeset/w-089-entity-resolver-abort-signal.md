---
'@graphorin/memory': patch
---

W-089: `EntityResolver` now forwards the caller's `AbortSignal` to `embedder.embed` (it was accepted and then discarded), so cancelling a write really interrupts a remote embedding call. An abort degrades to mint-new - the correct cancellation semantics for a best-effort enrichment - and never surfaces as an error from `resolve`/`linkFact`. The memory guide also cross-references the known fixed 1000-entity fuzzy-dedup window documented in the security guide.
