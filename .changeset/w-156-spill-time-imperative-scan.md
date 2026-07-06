---
'@graphorin/tools': patch
---

Cross-page imperative patterns in spill artifacts are now caught at spill time (W-156): `read_result` pages are strip-scanned independently, so a pattern split by a page boundary ("ignore previous" at the end of page N, "instructions" at the start of N+1) evaded the heuristic layer in both halves. The framework now runs one whole-artifact scan in `spillToFile` before ANY `SpillWriter` (custom writers included) and passes `imperativePatternsPresent` in the write opts; the default writer persists it in the taint sidecar, the file reader surfaces it as `producerImperativeFlagged`, and the executor increments the new `tool.inbound.sanitization.cross-page-flag.total` counter on tainted handle reads. The load-bearing defenses were never boundary-dependent and are unchanged: every tainted page keeps its unconditional `<<<untrusted_content>>>` envelope and producer-taint provenance; artifacts without producer taint deliberately carry no flag.
