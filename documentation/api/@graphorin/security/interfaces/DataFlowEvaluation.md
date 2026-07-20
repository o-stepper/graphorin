[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DataFlowEvaluation

# Interface: DataFlowEvaluation

Defined in: packages/security/src/dataflow/types.ts:257

**`Stable`**

The signal a [DataFlowPolicy](/api/@graphorin/security/interfaces/DataFlowPolicy.md) evaluates for one candidate sink
call. Populated by the enforcement point from the resolved tool's
metadata plus the run's [TaintLedger](/api/@graphorin/security/interfaces/TaintLedger.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-carriesuntrustedverbatim"></a> `carriesUntrustedVerbatim` | `readonly` | `boolean` | `true` when the sink's arguments carry untrusted content verbatim. | packages/security/src/dataflow/types.ts:273 |
| <a id="property-sensitiveseen"></a> `sensitiveSeen` | `readonly` | `boolean` | `true` when secret-tier content has entered the run. | packages/security/src/dataflow/types.ts:277 |
| <a id="property-sideeffectclass"></a> `sideEffectClass` | `readonly` | [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md) | The sink's resolved side-effect class. | packages/security/src/dataflow/types.ts:261 |
| <a id="property-sinkkind"></a> `sinkKind?` | `readonly` | `"tool"` \| `"assistant-output"` | B4 (item 14): what KIND of sink this evaluation describes. `'tool'` (default when absent) - a tool call gated by its side-effect class. `'assistant-output'` - the run's outgoing assistant text, a sink by definition regardless of side-effect class (the reply surface exfiltrates to whoever reads it). Declassify matching stays on `toolName` (e.g. the stable id `'assistant-output'` in `declassifySinks`). | packages/security/src/dataflow/types.ts:271 |
| <a id="property-sourcekinds"></a> `sourceKinds` | `readonly` | readonly `string`[] | Untrusted source kinds relevant to this flow (matched + observed). | packages/security/src/dataflow/types.ts:279 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | Name of the sink tool about to run (the stable sink id). | packages/security/src/dataflow/types.ts:259 |
| <a id="property-untrustedseen"></a> `untrustedSeen` | `readonly` | `boolean` | `true` when untrusted content has entered the run. | packages/security/src/dataflow/types.ts:275 |
