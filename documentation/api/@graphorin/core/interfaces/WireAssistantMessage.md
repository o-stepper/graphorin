[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireAssistantMessage

# Interface: WireAssistantMessage

Defined in: [packages/core/src/utils/binary-json.ts:98](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L98)

Wire twin of [AssistantMessage](/api/@graphorin/core/interfaces/AssistantMessage.md).

## Stable

## Extends

- `Omit`\&lt;[`AssistantMessage`](/api/@graphorin/core/interfaces/AssistantMessage.md), `"content"`\&gt;

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | Multi-agent attribution: which agent produced this message. Required by the multi-agent crew acceptance criteria. | [`AssistantMessage`](/api/@graphorin/core/interfaces/AssistantMessage.md).[`agentId`](/api/@graphorin/core/interfaces/AssistantMessage.md#property-agentid) | [packages/core/src/types/message.ts:166](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L166) |
| <a id="property-content"></a> `content` | `readonly` | \| `string` \| readonly [`WireMessageContent`](/api/@graphorin/core/type-aliases/WireMessageContent.md)[] | - | - | [packages/core/src/utils/binary-json.ts:99](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L99) |
| <a id="property-role"></a> `role` | `readonly` | `"assistant"` | - | [`AssistantMessage`](/api/@graphorin/core/interfaces/AssistantMessage.md).[`role`](/api/@graphorin/core/interfaces/AssistantMessage.md#property-role) | [packages/core/src/types/message.ts:159](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L159) |
| <a id="property-toolcalls"></a> `toolCalls?` | `readonly` | readonly [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md)[] | - | [`AssistantMessage`](/api/@graphorin/core/interfaces/AssistantMessage.md).[`toolCalls`](/api/@graphorin/core/interfaces/AssistantMessage.md#property-toolcalls) | [packages/core/src/types/message.ts:161](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L161) |
