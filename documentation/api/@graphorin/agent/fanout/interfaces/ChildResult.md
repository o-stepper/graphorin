[**Graphorin API reference v0.10.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [fanout](/api/@graphorin/agent/fanout/index.md) / ChildResult

# Interface: ChildResult\&lt;TOutput\&gt;

Defined in: [packages/agent/src/fanout/index.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/fanout/index.ts#L76)

Per-child outcome surfaced on
[FanOutResult.children](/api/@graphorin/agent/fanout/interfaces/FanOutResult.md#property-children). Failed-child isolation: a child
that throws produces a `ChildResult` with `status: 'failed'` -
never an exception thrown from the fan-out call itself.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | [packages/agent/src/fanout/index.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/fanout/index.ts#L77) |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | - | [packages/agent/src/fanout/index.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/fanout/index.ts#L83) |
| <a id="property-error"></a> `error?` | `readonly` | \{ `code`: `string`; `message`: `string`; \} | - | [packages/agent/src/fanout/index.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/fanout/index.ts#L80) |
| `error.code` | `readonly` | `string` | - | [packages/agent/src/fanout/index.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/fanout/index.ts#L80) |
| `error.message` | `readonly` | `string` | - | [packages/agent/src/fanout/index.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/fanout/index.ts#L80) |
| <a id="property-output"></a> `output?` | `readonly` | `TOutput` | - | [packages/agent/src/fanout/index.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/fanout/index.ts#L79) |
| <a id="property-status"></a> `status` | `readonly` | `"budget-exceeded"` \| `"completed"` \| `"failed"` \| `"cancelled"` | - | [packages/agent/src/fanout/index.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/fanout/index.ts#L78) |
| <a id="property-tokensused"></a> `tokensUsed` | `readonly` | `number` | - | [packages/agent/src/fanout/index.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/fanout/index.ts#L81) |
| <a id="property-toolcallcount"></a> `toolCallCount` | `readonly` | `number` | - | [packages/agent/src/fanout/index.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/fanout/index.ts#L82) |
| <a id="property-usage"></a> `usage?` | `readonly` | [`Usage`](/api/@graphorin/core/interfaces/Usage.md) | Full usage breakdown, present only for usage-reporting children (an `invoke` resolving to a full `AgentResult`, W-033). | [packages/agent/src/fanout/index.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/fanout/index.ts#L88) |
