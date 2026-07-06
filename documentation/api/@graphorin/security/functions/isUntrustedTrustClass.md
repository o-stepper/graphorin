[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / isUntrustedTrustClass

# Function: isUntrustedTrustClass()

```ts
function isUntrustedTrustClass(trustClass): boolean;
```

Defined in: [packages/security/src/dataflow/derive.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/derive.ts#L28)

Whether a tool trust class is an UNTRUSTED-content source (W-101).
The single definition shared by the taint engine
([deriveTaintLabel](/api/@graphorin/security/functions/deriveTaintLabel.md)) and the Rule-of-Two `untrustedInput` leg -
the two layers must never disagree about what "untrusted" means.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `trustClass` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) |

## Returns

`boolean`

## Stable
