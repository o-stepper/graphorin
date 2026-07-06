[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / classifyLocalProvider

# Function: classifyLocalProvider()

```ts
function classifyLocalProvider(baseUrl): LocalProviderClassification;
```

Defined in: [packages/provider/src/trust/classify-local-provider.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/provider/src/trust/classify-local-provider.ts#L63)

Classify a URL string into one of the four [LocalProviderTrust](/api/@graphorin/provider/type-aliases/LocalProviderTrust.md)
tiers. Throws `TypeError` if the URL is unparseable so adapters
fail fast at construction time (programming error; not a runtime
fault).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `baseUrl` | `string` |

## Returns

[`LocalProviderClassification`](/api/@graphorin/provider/interfaces/LocalProviderClassification.md)

## Stable
