[**Graphorin API reference v0.13.9**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / bySensitivity

# Function: bySensitivity()

```ts
function bySensitivity(args?): DescribedFilter;
```

Defined in: packages/agent/src/filters/index.ts:189

**`Stable`**

Drop messages that carry the literal `[REDACTED:secret]` redaction
token when `maxTier` sits below `'secret'`.

WEAK CONTRACT - read before relying on it at a trust
boundary: `MessageContent` has NO part-level sensitivity /
`secret` / `inboundTrust` annotation in the current surface, so
this filter can only key on the redaction token the framework's
redaction layer stamps into text. Content that was never
redaction-stamped - an annotated-elsewhere secret, plaintext
credentials the model echoed - passes through untouched. It is a
best-effort hygiene filter, NOT a sensitivity gate; do not treat a
sub-agent handoff filtered by it as a secrecy boundary. Operators
that need a real gate must scrub content upstream (redaction
middleware, `withRedaction`) or compose a custom predicate over
their own metadata.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `maxTier?`: [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md); \} |
| `args.maxTier?` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) |

## Returns

[`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md)
