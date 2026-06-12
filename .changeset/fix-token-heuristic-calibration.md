---
'@graphorin/memory': patch
---

CE-13: the built-in token heuristic is script-aware — CJK / kana /
hangul characters count at ~1 token each instead of chars/4 (a ~4x
undercount that let non-Latin conversations hit the provider's real
context limit before compaction ever fired). When the heuristic is
budgeting against a configured `providerContextWindow` the engine warns
once, pointing at the `contextEngine.tokenCounter` wiring for
production accuracy.
