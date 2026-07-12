[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DataFlowFinding

# Interface: DataFlowFinding

Defined in: [packages/security/src/dataflow/types.ts:287](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L287)

The details attached to a non-`allow` [DataFlowDecision](/api/@graphorin/security/type-aliases/DataFlowDecision.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-flow"></a> `flow` | `readonly` | [`TaintFlowKind`](/api/@graphorin/security/type-aliases/TaintFlowKind.md) | Which flow tripped the policy. | [packages/security/src/dataflow/types.ts:289](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L289) |
| <a id="property-reason"></a> `reason` | `readonly` | `string` | Human-readable, *metadata-only* explanation (never raw arg/output bytes). | [packages/security/src/dataflow/types.ts:291](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L291) |
| <a id="property-sourcekinds"></a> `sourceKinds` | `readonly` | readonly `string`[] | Untrusted source kinds implicated in the flow. | [packages/security/src/dataflow/types.ts:293](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L293) |
