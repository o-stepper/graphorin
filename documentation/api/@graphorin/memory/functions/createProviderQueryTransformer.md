[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createProviderQueryTransformer

# Function: createProviderQueryTransformer()

```ts
function createProviderQueryTransformer(provider, options?): QueryTransformer;
```

Defined in: [packages/memory/src/search/query-transform.ts:197](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/query-transform.ts#L197)

Wrap a [Provider](/api/@graphorin/core/interfaces/Provider.md) as a [QueryTransformer](/api/@graphorin/memory/interfaces/QueryTransformer.md). Both methods
are **resilient**: a provider error or unparseable response degrades
to `[]` / `null` so transformation never throws into `search`. The
`maxVariants` ceiling caps the variants requested regardless of the
caller's `multiQuery` value (a latency guardrail).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `provider` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) |
| `options` | \{ `maxTokens?`: `number`; `maxVariants?`: `number`; \} |
| `options.maxTokens?` | `number` |
| `options.maxVariants?` | `number` |

## Returns

[`QueryTransformer`](/api/@graphorin/memory/interfaces/QueryTransformer.md)

## Stable
