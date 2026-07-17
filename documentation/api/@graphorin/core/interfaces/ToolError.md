[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolError

# Interface: ToolError

Defined in: [packages/core/src/types/tool.ts:263](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L263)

The unsuccessful outcome of a tool invocation. The model sees a textual
representation of `message`; the runtime sees the typed shape.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cause"></a> `cause?` | `readonly` | `unknown` | Optional underlying cause (chained errors). | [packages/core/src/types/tool.ts:269](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L269) |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | Optional remediation hint for human readers. | [packages/core/src/types/tool.ts:271](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L271) |
| <a id="property-kind"></a> `kind` | `readonly` | [`ToolErrorKind`](/api/@graphorin/core/type-aliases/ToolErrorKind.md) | - | [packages/core/src/types/tool.ts:266](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L266) |
| <a id="property-message"></a> `message` | `readonly` | `string` | - | [packages/core/src/types/tool.ts:267](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L267) |
| <a id="property-recoverable"></a> `recoverable?` | `readonly` | `boolean` | Whether retrying the SAME call can plausibly succeed (C3). Stamped from the error kind by the executor; the harness-side transparent retry consults it together with the tool's side-effect safety. | [packages/core/src/types/tool.ts:277](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L277) |
| <a id="property-recoveryhint"></a> `recoveryHint?` | `readonly` | [`RecoveryHint`](/api/@graphorin/core/type-aliases/RecoveryHint.md) | Model-facing recovery guidance derived from the error kind (C3). | [packages/core/src/types/tool.ts:279](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L279) |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | [packages/core/src/types/tool.ts:264](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L264) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | [packages/core/src/types/tool.ts:265](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L265) |
