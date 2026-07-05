---
'@graphorin/core': minor
'@graphorin/provider': minor
'@graphorin/agent': minor
---

W-024: thinking-block signatures now actually round-trip - the whole retention pipeline was dead because nothing captured them.

`ProviderEvent` gains a `{type: 'reasoning-end', meta?: ReasoningContentMeta}` terminator (per-block, matching both AI SDK generations). The vercel adapter maps v4 `reasoning-signature`/`redacted-reasoning` chunks and v7 `reasoning-end` (`providerMetadata.anthropic.signature`/`.redactedData`) onto it; `reasoning-start` stays a no-op. The agent runtime flushes buffered deltas into per-block `ReasoningContent` parts carrying the meta (redacted blocks become meta-only parts), and the step assembles those parts instead of one meta-less collapse - adapters without block structure keep the collapsed fallback. Downstream, the already-shipped chain finally engages: `applyReasoningPolicy('pass-through-claude')` retains the signed parts and `toAssistantPart` emits `providerOptions.anthropic.signature`, so multi-step tool use with Anthropic extended thinking replays each block byte-equal (pinned end-to-end: the step-2 request carries both signatures of a two-block step-1). Known scope limit: the one-shot `generate()` path still returns no reasoning (`ProviderResponse` has no field for it). MIGRATION: external exhaustive switches over `ProviderEvent` need a case for `'reasoning-end'`; transcripts may now carry several reasoning parts per step instead of one.
