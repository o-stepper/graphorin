[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AssistantMessage

# Interface: AssistantMessage

Defined in: [packages/core/src/types/message.ts:158](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L158)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | Multi-agent attribution: which agent produced this message. Required by the multi-agent crew acceptance criteria. | [packages/core/src/types/message.ts:166](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L166) |
| <a id="property-content"></a> `content` | `readonly` | \| `string` \| readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[] | - | [packages/core/src/types/message.ts:160](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L160) |
| <a id="property-role"></a> `role` | `readonly` | `"assistant"` | - | [packages/core/src/types/message.ts:159](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L159) |
| <a id="property-toolcalls"></a> `toolCalls?` | `readonly` | readonly [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md)[] | - | [packages/core/src/types/message.ts:161](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/message.ts#L161) |
