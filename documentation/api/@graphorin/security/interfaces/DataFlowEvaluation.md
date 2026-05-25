[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DataFlowEvaluation

# Interface: DataFlowEvaluation

Defined in: packages/security/src/dataflow/types.ts:163

The signal a [DataFlowPolicy](/api/@graphorin/security/interfaces/DataFlowPolicy.md) evaluates for one candidate sink
call. Populated by the enforcement point from the resolved tool's
metadata plus the run's [TaintLedger](/api/@graphorin/security/interfaces/TaintLedger.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-carriesuntrustedverbatim"></a> `carriesUntrustedVerbatim` | `readonly` | `boolean` | `true` when the sink's arguments carry untrusted content verbatim. | packages/security/src/dataflow/types.ts:169 |
| <a id="property-sensitiveseen"></a> `sensitiveSeen` | `readonly` | `boolean` | `true` when secret-tier content has entered the run. | packages/security/src/dataflow/types.ts:173 |
| <a id="property-sideeffectclass"></a> `sideEffectClass` | `readonly` | [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md) | The sink's resolved side-effect class. | packages/security/src/dataflow/types.ts:167 |
| <a id="property-sourcekinds"></a> `sourceKinds` | `readonly` | readonly `string`[] | Untrusted source kinds relevant to this flow (matched + observed). | packages/security/src/dataflow/types.ts:175 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | Name of the sink tool about to run. | packages/security/src/dataflow/types.ts:165 |
| <a id="property-untrustedseen"></a> `untrustedSeen` | `readonly` | `boolean` | `true` when untrusted content has entered the run. | packages/security/src/dataflow/types.ts:171 |
