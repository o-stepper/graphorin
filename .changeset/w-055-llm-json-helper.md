---
'@graphorin/memory': patch
---

W-055: the tolerant LLM-JSON parsing helpers now have a single definition. `stripFence` (7 copy-pasted bodies across consolidator phases, reconcile and the search transformers) and `sliceJsonObject` (3 copies) moved to the package-internal `internal/llm-json.ts`; all former call sites import it. Behaviour is byte-identical (the copies had already been verified identical, including the ReDoS-safe `[^\n]*` info-string match), so future fixes - like the CodeQL ReDoS patch that had to touch all 10 copies at once - land in one place. No public API change.
