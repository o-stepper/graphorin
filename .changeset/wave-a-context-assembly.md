---
'@graphorin/memory': patch
'@graphorin/agent': patch
---

Fix three context-assembly defects (context-engine-02/03/04). The default post-compaction hooks (persona block, project rules, pinned facts) now apply the same D2 privacy decision as `assemble()`, so `sensitivity:'secret'` content the assembly withholds can no longer leak to the provider via the post-compaction splice. `renderMessageText` renders assistant tool-call arguments and `adaptTokenCounter` preserves the native `count(messages)` path, so tool-call args (file writes, code_execute scripts) finally contribute to trigger/before/after token arithmetic. And the trigger, SOTA-4 reclaim floor, and anti-thrash guard now share one full-buffer basis: `shouldCompact` takes `compactableFromIndex` (the pinned prefix is no longer counted as reclaimable) and `compactNow` takes `prefixMessages` so the guard arms against prefix + body + essentials instead of the sliced body - previously any real system prompt defeated the guard and a summarizer LLM call re-fired every step at the context edge.
