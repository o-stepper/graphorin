[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowResumeOptions

# Interface: WorkflowResumeOptions

Defined in: packages/workflow/src/types.ts:134

Optional context passed to [Workflow.resume](/api/@graphorin/workflow/interfaces/Workflow.md#resume). The `directive`
argument is the typed value supplied to the paused node + optional
channel writes.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/workflow/src/types.ts:136 |
| <a id="property-stream"></a> `stream?` | `readonly` | [`StreamMode`](/api/@graphorin/workflow/type-aliases/StreamMode.md) | packages/workflow/src/types.ts:135 |
