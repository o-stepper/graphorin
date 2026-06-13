---
'@graphorin/memory': minor
---

Add the `clear-old-tool-results` compaction strategy — a zero-LLM pre-compaction tier (SOTA-1, Anthropic `clear_tool_uses` pattern). When the in-flight buffer crosses the threshold, the oldest tool results are replaced with compact placeholders **before** any summarizer LLM call; the summarizer runs only if clearing did not reclaim enough (and then over the already-reduced buffer). Knobs `keepToolUses` (most-recent results kept verbatim), `clearAtLeast` (skip clearing below a token floor), `excludeTools` (never clear these), and `summarizeFallback` (`false` for a pure zero-LLM tier). The pure `clearOldToolResults(messages, options, counter)` helper is exported for direct use. Fully offline and deterministic.
