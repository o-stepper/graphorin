---
'@graphorin/pricing': patch
---

fix(pricing): bill reasoning tokens at the output rate; document cached-read contract (PS-19)

`ModelPrice` documented that reasoning tokens follow completion pricing unless an
entry declares an explicit `reasoningUsdPerToken`, but `calculateCost` only
charged reasoning when that explicit field was present — and no bundled entry
has it, so every reasoning token was billed at $0. The `cachedReadTokens` ↔
`inputTokens` relationship was also undocumented, inviting double-counting.

- Reasoning tokens are now billed at `reasoningUsdPerToken ?? outputUsdPerToken`.
- `calculateCost`'s contract is documented: `inputTokens` excludes
  `cachedReadTokens` (cached reads bill separately at the cached rate).

Red-first: a test asserts reasoning tokens cost the output rate (not $0), and a
second asserts cached-read tokens add only the cached rate on top of the input.
