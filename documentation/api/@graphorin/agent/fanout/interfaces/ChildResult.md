[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [fanout](/api/@graphorin/agent/fanout/index.md) / ChildResult

# Interface: ChildResult\&lt;TOutput\&gt;

Defined in: packages/agent/src/fanout/index.ts:75

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

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/agent/src/fanout/index.ts:76 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | packages/agent/src/fanout/index.ts:82 |
| <a id="property-error"></a> `error?` | `readonly` | \{ `code`: `string`; `message`: `string`; \} | packages/agent/src/fanout/index.ts:79 |
| `error.code` | `readonly` | `string` | packages/agent/src/fanout/index.ts:79 |
| `error.message` | `readonly` | `string` | packages/agent/src/fanout/index.ts:79 |
| <a id="property-output"></a> `output?` | `readonly` | `TOutput` | packages/agent/src/fanout/index.ts:78 |
| <a id="property-status"></a> `status` | `readonly` | `"completed"` \| `"failed"` \| `"budget-exceeded"` \| `"cancelled"` | packages/agent/src/fanout/index.ts:77 |
| <a id="property-tokensused"></a> `tokensUsed` | `readonly` | `number` | packages/agent/src/fanout/index.ts:80 |
| <a id="property-toolcallcount"></a> `toolCallCount` | `readonly` | `number` | packages/agent/src/fanout/index.ts:81 |
