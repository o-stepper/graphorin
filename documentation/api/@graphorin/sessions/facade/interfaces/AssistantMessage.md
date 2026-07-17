[**Graphorin API reference v0.10.2**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [facade](/api/@graphorin/sessions/facade/index.md) / AssistantMessage

# Interface: AssistantMessage

Defined in: [packages/core/dist/types/message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/message.d.ts)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | Multi-agent attribution: which agent produced this message. Required by the multi-agent crew acceptance criteria. | [packages/core/dist/types/message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/message.d.ts) |
| <a id="property-content"></a> `content` | `readonly` | \| `string` \| readonly [`MessageContent`](/api/@graphorin/sessions/facade/type-aliases/MessageContent.md)[] | - | [packages/core/dist/types/message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/message.d.ts) |
| <a id="property-role"></a> `role` | `readonly` | `"assistant"` | - | [packages/core/dist/types/message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/message.d.ts) |
| <a id="property-toolcalls"></a> `toolCalls?` | `readonly` | readonly [`ToolCall`](/api/@graphorin/core/interfaces/ToolCall.md)[] | - | [packages/core/dist/types/message.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/types/message.d.ts) |
