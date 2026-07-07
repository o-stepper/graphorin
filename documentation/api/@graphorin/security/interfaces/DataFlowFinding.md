[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DataFlowFinding

# Interface: DataFlowFinding

Defined in: [packages/security/src/dataflow/types.ts:267](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L267)

The details attached to a non-`allow` [DataFlowDecision](/api/@graphorin/security/type-aliases/DataFlowDecision.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-flow"></a> `flow` | `readonly` | [`TaintFlowKind`](/api/@graphorin/security/type-aliases/TaintFlowKind.md) | Which flow tripped the policy. | [packages/security/src/dataflow/types.ts:269](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L269) |
| <a id="property-reason"></a> `reason` | `readonly` | `string` | Human-readable, *metadata-only* explanation (never raw arg/output bytes). | [packages/security/src/dataflow/types.ts:271](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L271) |
| <a id="property-sourcekinds"></a> `sourceKinds` | `readonly` | readonly `string`[] | Untrusted source kinds implicated in the flow. | [packages/security/src/dataflow/types.ts:273](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L273) |
