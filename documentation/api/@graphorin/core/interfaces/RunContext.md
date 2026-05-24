[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunContext

# Interface: RunContext\&lt;TDeps\&gt;

Defined in: packages/core/src/types/run.ts:134

Per-run dependency / context bag handed to every tool, hook and
provider middleware in scope. Generic over the user-defined deps shape.

`tracer`, `signal`, `usage` and `state` are always present; everything
else is optional.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/run.ts:138 |
| <a id="property-deps"></a> `deps` | `readonly` | `TDeps` | packages/core/src/types/run.ts:139 |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | packages/core/src/types/run.ts:144 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/run.ts:135 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/run.ts:136 |
| <a id="property-signal"></a> `signal` | `readonly` | `AbortSignal` | packages/core/src/types/run.ts:141 |
| <a id="property-state"></a> `state` | `readonly` | [`RunState`](/api/@graphorin/core/interfaces/RunState.md) | packages/core/src/types/run.ts:145 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/core/src/types/run.ts:143 |
| <a id="property-tracer"></a> `tracer` | `readonly` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | packages/core/src/types/run.ts:140 |
| <a id="property-usage"></a> `usage` | `readonly` | [`UsageAccumulator`](/api/@graphorin/core/interfaces/UsageAccumulator.md) | packages/core/src/types/run.ts:142 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | packages/core/src/types/run.ts:137 |
