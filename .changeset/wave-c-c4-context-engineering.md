---
'@graphorin/memory': minor
---

Context-engineering adoptions (audit 2026-07-04 Wave C, cluster C4).

- Compaction failure hardening: one retry with backoff on summarizer failure; an auto-trigger pass that does not shrink the buffer FAILS (compression-loop class); after 3 consecutive failures the auto trigger disables itself until a later successful pass re-arms it.
- Recent user messages survive compaction verbatim (`preserveUserMessages`, default 2) - only assistant/tool content is summarized away.
- Summary prompt upgrades: handoff-to-another-LLM framing, quote-identifiers-VERBATIM rule, new "Constraints and non-negotiables" section (12 sections, v1.3); template id renamed to `summary-sections` (context-engine-14).
- Clearing-tier parity with `clear_tool_uses_20250919`: `clearToolInputs` blanks paired assistant tool-call args; `readResultToolName: null` keeps the externalized-handle placeholder honest when `read_result` is not registered (context-engine-11).
- New `reanchorRecentResults` post-compaction hook (+ `ctx.droppedMessages` on the hook context): re-injects the result handles a compaction just dropped, with bounded previews via an optional `readPreview` resolver.
