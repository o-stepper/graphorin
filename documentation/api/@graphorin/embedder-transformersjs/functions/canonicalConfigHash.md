[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/embedder-transformersjs](/api/@graphorin/embedder-transformersjs/index.md) / canonicalConfigHash

# Function: canonicalConfigHash()

```ts
function canonicalConfigHash(config): string;
```

Defined in: packages/embedder-transformersjs/src/index.ts:267

Canonical-JSON deterministic hash of an embedder configuration.
Object keys are sorted lexicographically; primitives flow through as
`JSON.stringify` would render them. Used by the multi-table per-
embedder vec0 layout to tell drift apart from a true model swap.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | `unknown` |

## Returns

`string`

## Stable
