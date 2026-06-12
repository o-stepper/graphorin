---
'@graphorin/memory': patch
---

fix(memory): structure-aware `truncateToTokens` (CE-16e)

The per-layer cap in the token-budget allocator truncates layer text with
`truncateToTokens`, which could cut mid-XML — leaving a dangling partial tag
or an unclosed `<memory_blocks>` in the assembled system prompt. The cut now
snaps out of a partially-emitted tag and re-closes any block tags it left
open after the `[...truncated]` marker (innermost-first), shaving the kept
body when the closers would push past the cap. Plain-string truncation is
unchanged.
