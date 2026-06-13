---
'@graphorin/memory': minor
---

Recoverable tool-result clearing (A6 / SOTA-2). The zero-LLM `clear-old-tool-results` compaction tier (SOTA-1) dropped cleared content behind a bare placeholder. It now accepts an opt-in `externalize` callback (on `ClearToolResultsOptions` and the strategy variant): when wired to a spill / `read_result` registry, each cleared tool result is saved behind a handle and the placeholder references it, so the model can re-fetch the full result via `read_result` instead of losing it. `externalize` runs only for clears that actually commit (after the `clearAtLeast` floor), so a rejected clearing never spills. Omitted ⇒ the bare placeholder (byte-identical default). `clearOldToolResults` is now exported from the package root.
