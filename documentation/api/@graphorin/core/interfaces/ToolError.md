[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolError

# Interface: ToolError

Defined in: packages/core/src/types/tool.ts:263

**`Stable`**

The unsuccessful outcome of a tool invocation. The model sees a textual
representation of `message`; the runtime sees the typed shape.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cause"></a> `cause?` | `readonly` | `unknown` | Optional underlying cause (chained errors). | packages/core/src/types/tool.ts:269 |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | Optional remediation hint for human readers. | packages/core/src/types/tool.ts:271 |
| <a id="property-kind"></a> `kind` | `readonly` | [`ToolErrorKind`](/api/@graphorin/core/type-aliases/ToolErrorKind.md) | - | packages/core/src/types/tool.ts:266 |
| <a id="property-message"></a> `message` | `readonly` | `string` | - | packages/core/src/types/tool.ts:267 |
| <a id="property-recoverable"></a> `recoverable?` | `readonly` | `boolean` | Whether retrying the SAME call can plausibly succeed. Stamped from the error kind by the executor; the harness-side transparent retry consults it together with the tool's side-effect safety. | packages/core/src/types/tool.ts:277 |
| <a id="property-recoveryhint"></a> `recoveryHint?` | `readonly` | [`RecoveryHint`](/api/@graphorin/core/type-aliases/RecoveryHint.md) | Model-facing recovery guidance derived from the error kind. | packages/core/src/types/tool.ts:279 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | packages/core/src/types/tool.ts:264 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/core/src/types/tool.ts:265 |
