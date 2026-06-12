---
'@graphorin/agent': patch
---

fix(agent): preserve a thrown provider error's kind so model fallback fires (AG-21)

Any exception from `provider.stream(...)` was flattened to
`{ kind: 'unknown', ... }`, and `isAgentFallbackEligible` treats `'unknown'` as
always ineligible — so fallback only ever worked for adapters that *emit* a
structured `{ type: 'error', error: { kind } }` event. Providers that **throw**
typed errors (e.g. `RateLimitExceededError` from the `withRateLimit` middleware)
bypassed the agent's rate-limit fallback entirely.

The stream catch now classifies a thrown cause into a `ProviderErrorKind` by
reading the structural `kind` carried by `@graphorin/provider`'s error classes
(no import — the agent stays decoupled), mapping `'rate-limit-exceeded'` →
`'rate-limit'`. A thrown rate-limit error now falls over to the next model just
like the emitted form. (Shares the catch block with AG-6.)
