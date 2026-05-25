[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/embedder-ollama](/api/@graphorin/embedder-ollama/index.md) / canonicalConfigHash

# Function: canonicalConfigHash()

```ts
function canonicalConfigHash(config): string;
```

Defined in: packages/embedder-ollama/src/index.ts:348

Canonical-JSON deterministic hash over an embedder configuration.
Object keys are sorted lexicographically so the resulting hash is
stable across `JSON.stringify` reorderings.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | `unknown` |

## Returns

`string`

## Stable
