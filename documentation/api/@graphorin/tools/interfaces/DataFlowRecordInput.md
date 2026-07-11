[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / DataFlowRecordInput

# Interface: DataFlowRecordInput

Defined in: [packages/tools/src/executor/types.ts:230](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L230)

Input to [DataFlowGuard.record](/api/@graphorin/tools/interfaces/DataFlowGuard.md#record).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-outputtext"></a> `outputText` | `readonly` | `string` | The (sanitized) output text the model will see. | [packages/tools/src/executor/types.ts:246](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L246) |
| <a id="property-runcontext"></a> `runContext` | `readonly` | [`RunContext`](/api/@graphorin/core/interfaces/RunContext.md) | - | [packages/tools/src/executor/types.ts:247](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L247) |
| <a id="property-sensitivity"></a> `sensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | - | [packages/tools/src/executor/types.ts:243](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L243) |
| <a id="property-source"></a> `source?` | `readonly` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) | - | [packages/tools/src/executor/types.ts:244](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L244) |
| <a id="property-taintoverride"></a> `taintOverride?` | `readonly` | \{ `sensitive?`: `boolean`; `sourceKind?`: `string`; `untrusted?`: `boolean`; \} | C6: per-result taint override from the tool's ToolReturn envelope. Flags only ever WIDEN the derived label (guards must never let an override downgrade an untrusted tool's output). | [packages/tools/src/executor/types.ts:238](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L238) |
| `taintOverride.sensitive?` | `readonly` | `boolean` | - | [packages/tools/src/executor/types.ts:240](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L240) |
| `taintOverride.sourceKind?` | `readonly` | `string` | - | [packages/tools/src/executor/types.ts:241](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L241) |
| `taintOverride.untrusted?` | `readonly` | `boolean` | - | [packages/tools/src/executor/types.ts:239](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L239) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | [packages/tools/src/executor/types.ts:231](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L231) |
| <a id="property-trustclass"></a> `trustClass` | `readonly` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | - | [packages/tools/src/executor/types.ts:232](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L232) |
