[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / setLookupWarnSink

# Function: setLookupWarnSink()

```ts
function setLookupWarnSink(sink): void;
```

Defined in: [packages/pricing/src/lookup.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/lookup.ts#L21)

**`Internal`**

Optional sink for the deduplicated WARN emitted on unknown models.
Defaults to `console.warn`. Override in tests.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `sink` | (`line`) => `void` |

## Returns

`void`
