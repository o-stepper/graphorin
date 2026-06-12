---
'@graphorin/provider': patch
---

fix(provider): vercelAdapter speaks both AI SDK v4 and v7 wire shapes (PS-6)

Against the actual `ai@^7` peer, the adapter mapped v4-only shapes — plain-text
chat worked (deceptively partial breakage) while everything else silently
broke:

- v7 streams `tool-input-start` / `tool-input-delta` (keyed by `id`/`delta`) —
  the adapter only handled the v4 `tool-call-streaming-start` /
  `tool-call-delta` (`toolCallId`/`argsTextDelta`) pair, so tool-call streaming
  fell into the forward-compat no-op.
- v7's finish part carries `totalUsage`; reading the v4 `usage` produced
  `{0,0,0}` — zeroing `withCostTracking`/`withCostLimit` on streaming.
- v7 `tool-call` parts (and `generateText` toolCalls) carry `input`, not
  `args` → `finalArgs: undefined` and broken tool dispatch in the agent.
- v7 renamed `maxTokens` → `maxOutputTokens` — the cap was silently inert.

The adapter now accepts both chunk-name pairs (with `id` vs `toolCallId`),
reads `totalUsage ?? usage`, normalizes `input ?? args` on tool calls in both
stream and generate paths, and sends `maxOutputTokens` alongside the legacy
`maxTokens`. v7 fixtures added for every shape (PS-26b); the v4 fixtures stay
green.
