[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolCallIncompleteEvent

# Interface: ToolCallIncompleteEvent

Defined in: packages/core/src/types/agent-event.ts:156

**`Stable`**

Emitted when the provider stream finished without delivering the
final arguments for a started tool call - typically `finishReason:
'length'`, the output-token ceiling cutting the call's argument JSON
mid-stream. Terminal for this `toolCallId`: no `tool.call.end` or
`tool.execute.*` events follow, the tool is never executed, and the
run then fails with error code `'incomplete-tool-call'` instead of
completing. Subscribers tracking call lifecycles close their state
off this event.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-argsprefix"></a> `argsPrefix` | `readonly` | `string` | The partial argument JSON accumulated before the stream ended. | packages/core/src/types/agent-event.ts:163 |
| <a id="property-finishreason"></a> `finishReason` | `readonly` | [`FinishReason`](/api/@graphorin/core/type-aliases/FinishReason.md) | Why the stream ended; `'length'` means the output-token ceiling. | packages/core/src/types/agent-event.ts:161 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | packages/core/src/types/agent-event.ts:158 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/core/src/types/agent-event.ts:159 |
| <a id="property-type"></a> `type` | `readonly` | `"tool.call.incomplete"` | - | packages/core/src/types/agent-event.ts:157 |
