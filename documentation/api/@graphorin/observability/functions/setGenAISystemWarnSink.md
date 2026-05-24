[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / setGenAISystemWarnSink

# Function: setGenAISystemWarnSink()

```ts
function setGenAISystemWarnSink(sink): void;
```

Defined in: packages/observability/src/gen-ai/system-derivation.ts:41

**`Internal`**

Override the WARN-once sink used for unrecognised provider class
names. Useful in tests so the suite does not pollute stderr.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `sink` | (`line`) => `void` |

## Returns

`void`
