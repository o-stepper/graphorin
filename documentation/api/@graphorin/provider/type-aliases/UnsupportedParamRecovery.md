[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / UnsupportedParamRecovery

# Type Alias: UnsupportedParamRecovery

```ts
type UnsupportedParamRecovery = "auto" | "off";
```

Defined in: packages/provider/src/internal/openai-shaped.ts:65

**`Stable`**

Policy for the one-shot HTTP 400 auto-recovery of model parameters
the server rejects (deep-retest-0.13.9 P1). `'auto'` (default): a
400 naming `temperature` re-sends the request without the field,
and a 400 requiring `reasoning_effort` `'none'` for function tools
re-sends with it; the instance keeps each switch and WARNs once.
`'off'` disables both recoveries so the original error surfaces.
The `max_tokens` remap is governed by `tokenLimitParam`, not this.
