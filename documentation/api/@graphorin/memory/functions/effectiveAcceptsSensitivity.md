[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / effectiveAcceptsSensitivity

# Function: effectiveAcceptsSensitivity()

```ts
function effectiveAcceptsSensitivity(context): readonly Sensitivity[];
```

Defined in: packages/memory/src/context-engine/privacy-filter.ts:82

**`Stable`**

Resolve the effective `acceptsSensitivity` set for a provider.
The function is pure: callers can supply a custom matrix to
override the defaults (used by tests + custom adapters).

Defaults (DEC-149, ADR-013 ext):

- `'loopback'`  → `['public', 'internal', 'secret']`.
- `'private'`   → `['public', 'internal']`.
- `'public-tls'` / `'public-cleartext'` → `['public']`.

Per-provider overrides always win over the defaults - pass
`providerAcceptsSensitivity` explicitly to override.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`PrivacyFilterContext`](/api/@graphorin/memory/interfaces/PrivacyFilterContext.md) |

## Returns

readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[]
