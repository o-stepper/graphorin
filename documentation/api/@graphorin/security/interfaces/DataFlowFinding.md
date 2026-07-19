[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DataFlowFinding

# Interface: DataFlowFinding

Defined in: packages/security/src/dataflow/types.ts:287

**`Stable`**

The details attached to a non-`allow` [DataFlowDecision](/api/@graphorin/security/type-aliases/DataFlowDecision.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-flow"></a> `flow` | `readonly` | [`TaintFlowKind`](/api/@graphorin/security/type-aliases/TaintFlowKind.md) | Which flow tripped the policy. | packages/security/src/dataflow/types.ts:289 |
| <a id="property-reason"></a> `reason` | `readonly` | `string` | Human-readable, *metadata-only* explanation (never raw arg/output bytes). | packages/security/src/dataflow/types.ts:291 |
| <a id="property-sourcekinds"></a> `sourceKinds` | `readonly` | readonly `string`[] | Untrusted source kinds implicated in the flow. | packages/security/src/dataflow/types.ts:293 |
