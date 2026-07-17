[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RunContext

# Interface: RunContext\&lt;TDeps\&gt;

Defined in: [packages/core/src/types/run.ts:330](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L330)

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

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | [packages/core/src/types/run.ts:334](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L334) |
| <a id="property-deps"></a> `deps` | `readonly` | `TDeps` | - | [packages/core/src/types/run.ts:335](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L335) |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - | [packages/core/src/types/run.ts:340](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L340) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | - | [packages/core/src/types/run.ts:331](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L331) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | - | [packages/core/src/types/run.ts:332](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L332) |
| <a id="property-signal"></a> `signal` | `readonly` | `AbortSignal` | - | [packages/core/src/types/run.ts:337](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L337) |
| <a id="property-span"></a> `span?` | `readonly` | [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md)\&lt;[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\&gt; | C7: the current `agent.step` span (when the runtime traces). Spans created inside tool execution parent under it so a run's traces form one tree. | [packages/core/src/types/run.ts:353](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L353) |
| <a id="property-state"></a> `state` | `readonly` | [`ReadonlyRunState`](/api/@graphorin/core/interfaces/ReadonlyRunState.md) | Read-only snapshot of the run's state (W-047). Tools observe the run; they do not mutate its bookkeeping - writes to `status`, `pendingApprovals` etc. are compile errors. The runtime keeps the only mutable reference. | [packages/core/src/types/run.ts:347](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L347) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | [packages/core/src/types/run.ts:339](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L339) |
| <a id="property-tracer"></a> `tracer` | `readonly` | [`Tracer`](/api/@graphorin/core/interfaces/Tracer.md) | - | [packages/core/src/types/run.ts:336](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L336) |
| <a id="property-usage"></a> `usage` | `readonly` | [`UsageAccumulator`](/api/@graphorin/core/interfaces/UsageAccumulator.md) | - | [packages/core/src/types/run.ts:338](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L338) |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - | [packages/core/src/types/run.ts:333](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/run.ts#L333) |
