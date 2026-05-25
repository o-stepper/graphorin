[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / computeSourceTrust

# Function: computeSourceTrust()

```ts
function computeSourceTrust(input, overrides?): number;
```

Defined in: packages/agent/src/lateral-leak/merge-guard.ts:84

Compose `baseline * provenance * historyAdjustment` and clamp.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ChildTrustInput`](/api/@graphorin/agent/interfaces/ChildTrustInput.md) |
| `overrides` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> |

## Returns

`number`

## Stable
