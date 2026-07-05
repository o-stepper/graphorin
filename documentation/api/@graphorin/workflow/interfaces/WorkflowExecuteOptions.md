[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowExecuteOptions

# Interface: WorkflowExecuteOptions

Defined in: packages/workflow/src/types.ts:121

Optional context passed to [Workflow.execute](/api/@graphorin/workflow/interfaces/Workflow.md#execute). `threadId` is
the stable resume key - supply it explicitly when the caller wants
deterministic IDs (CLI / tests); omit to let the runtime generate a
fresh ULID-style identifier.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-durability"></a> `durability?` | `readonly` | [`DurabilityMode`](/api/@graphorin/workflow/type-aliases/DurabilityMode.md) | Override the durability mode declared at workflow construction time. Useful for one-off `'exit'` runs in tests. | packages/workflow/src/types.ts:131 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation signal. Honored at every step boundary. | packages/workflow/src/types.ts:126 |
| <a id="property-stream"></a> `stream?` | `readonly` | [`StreamMode`](/api/@graphorin/workflow/type-aliases/StreamMode.md) | Stream emission mode. Default: `values`. | packages/workflow/src/types.ts:124 |
| <a id="property-threadid"></a> `threadId?` | `readonly` | `string` | - | packages/workflow/src/types.ts:122 |
