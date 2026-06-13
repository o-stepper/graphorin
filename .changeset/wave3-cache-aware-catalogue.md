---
'@graphorin/agent': patch
---

Make `tool_search` promotions append-only for prompt-cache stability (A7). Promoted deferred tools now join the per-step catalogue in promotion order (the new `orderPromotedTools` helper) rather than the registry's `listDeferred` order, so a tool promoted on a later step joins the END instead of potentially sorting ahead of an earlier promotion. The eager prefix and earlier promotions keep their byte position, so the provider's prompt-cache breakpoint survives across steps — the worst-case repeated-invalidation scenario for a long-running assistant.
