[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / DataFlowRecordInput

# Interface: DataFlowRecordInput

Defined in: packages/tools/src/executor/executor.ts:247

Input to [DataFlowGuard.record](/api/@graphorin/tools/interfaces/DataFlowGuard.md#record).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-outputtext"></a> `outputText` | `readonly` | `string` | The (sanitized) output text the model will see. | packages/tools/src/executor/executor.ts:263 |
| <a id="property-runcontext"></a> `runContext` | `readonly` | [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md) | - | packages/tools/src/executor/executor.ts:264 |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | packages/tools/src/executor/executor.ts:260 |
| <a id="property-source"></a> `source?` | `readonly` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) | - | packages/tools/src/executor/executor.ts:261 |
| <a id="property-taintoverride"></a> `taintOverride?` | `readonly` | \{ `sensitive?`: `boolean`; `sourceKind?`: `string`; `untrusted?`: `boolean`; \} | C6: per-result taint override from the tool's ToolReturn envelope. Flags only ever WIDEN the derived label (guards must never let an override downgrade an untrusted tool's output). | packages/tools/src/executor/executor.ts:255 |
| `taintOverride.sensitive?` | `readonly` | `boolean` | - | packages/tools/src/executor/executor.ts:257 |
| `taintOverride.sourceKind?` | `readonly` | `string` | - | packages/tools/src/executor/executor.ts:258 |
| `taintOverride.untrusted?` | `readonly` | `boolean` | - | packages/tools/src/executor/executor.ts:256 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/tools/src/executor/executor.ts:248 |
| <a id="property-trustclass"></a> `trustClass` | `readonly` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | - | packages/tools/src/executor/executor.ts:249 |
