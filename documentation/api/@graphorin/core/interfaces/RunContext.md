[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunContext

# Interface: RunContext\&lt;TDeps\&gt;

Defined in: packages/core/src/types/run.ts:337

**`Stable`**

Per-run dependency / context bag handed to every tool, hook and
provider middleware in scope. Generic over the user-defined deps shape.

`tracer`, `signal`, `usage` and `state` are always present; everything
else is optional.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/core/src/types/run.ts:341 |
| <a id="property-deps"></a> `deps` | `readonly` | `TDeps` | - | packages/core/src/types/run.ts:342 |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - | packages/core/src/types/run.ts:347 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | - | packages/core/src/types/run.ts:338 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | packages/core/src/types/run.ts:339 |
| <a id="property-signal"></a> `signal` | `readonly` | `AbortSignal` | - | packages/core/src/types/run.ts:344 |
| <a id="property-span"></a> `span?` | `readonly` | [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md)\&lt;[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\&gt; | The current `agent.step` span (when the runtime traces). Spans created inside tool execution parent under it so a run's traces form one tree. | packages/core/src/types/run.ts:360 |
| <a id="property-state"></a> `state` | `readonly` | [`ReadonlyRunState`](/api/@graphorin/core/interfaces/ReadonlyRunState.md) | Read-only snapshot of the run's state. Tools observe the run; they do not mutate its bookkeeping - writes to `status`, `pendingApprovals` etc. are compile errors. The runtime keeps the only mutable reference. | packages/core/src/types/run.ts:354 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | packages/core/src/types/run.ts:346 |
| <a id="property-tracer"></a> `tracer` | `readonly` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | - | packages/core/src/types/run.ts:343 |
| <a id="property-usage"></a> `usage` | `readonly` | [`UsageAccumulator`](/api/@graphorin/core/interfaces/UsageAccumulator.md) | - | packages/core/src/types/run.ts:345 |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | packages/core/src/types/run.ts:340 |
