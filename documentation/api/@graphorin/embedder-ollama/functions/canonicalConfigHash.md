[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/embedder-ollama](/api/@graphorin/embedder-ollama/index.md) / [](/api/@graphorin/embedder-ollama/README.md) / canonicalConfigHash

# Function: canonicalConfigHash()

```ts
function canonicalConfigHash(config): string;
```

Defined in: [packages/embedder-ollama/src/index.ts:375](https://github.com/o-stepper/graphorin/blob/main/packages/embedder-ollama/src/index.ts#L375)

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
