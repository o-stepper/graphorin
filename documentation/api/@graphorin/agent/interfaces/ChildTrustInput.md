[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / ChildTrustInput

# Interface: ChildTrustInput

Defined in: [packages/agent/src/lateral-leak/merge-guard.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/merge-guard.ts#L71)

Per-child input descriptor for [computeSourceTrust](/api/@graphorin/agent/functions/computeSourceTrust.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | [packages/agent/src/lateral-leak/merge-guard.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/merge-guard.ts#L72) |
| <a id="property-historyadjustment"></a> `historyAdjustment?` | `readonly` | `number` | Rolling trust score in `[0.0, 1.0]`. Defaults to `1.0`. | [packages/agent/src/lateral-leak/merge-guard.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/merge-guard.ts#L76) |
| <a id="property-origin"></a> `origin` | `readonly` | [`ContentOriginKind`](/api/@graphorin/agent/type-aliases/ContentOriginKind.md) | - | [packages/agent/src/lateral-leak/merge-guard.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/merge-guard.ts#L74) |
| <a id="property-trustclass"></a> `trustClass` | `readonly` | [`TrustClass`](/api/@graphorin/agent/type-aliases/TrustClass.md) | - | [packages/agent/src/lateral-leak/merge-guard.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/merge-guard.ts#L73) |
