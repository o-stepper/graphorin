[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / WorkflowResumeOptions

# Interface: WorkflowResumeOptions

Defined in: [packages/workflow/src/types.ts:141](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L141)

Optional context passed to [Workflow.resume](/api/@graphorin/workflow/interfaces/Workflow.md#resume). The `directive`
argument is the typed value supplied to the paused node + optional
channel writes.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowversionmismatch"></a> `allowVersionMismatch?` | `readonly` | `boolean` | Skip the [WorkflowConfig.version](/api/@graphorin/workflow/interfaces/WorkflowConfig.md#property-version) pin check (D1). By default a resume whose stored frontier was written by a different workflow version fails loudly with `workflow-version-mismatch` instead of replaying state through changed code. | [packages/workflow/src/types.ts:155](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L155) |
| <a id="property-durability"></a> `durability?` | `readonly` | [`DurabilityMode`](/api/@graphorin/workflow/type-aliases/DurabilityMode.md) | Override the durability mode for this resume (workflow-14) - mirrors [WorkflowExecuteOptions.durability](/api/@graphorin/workflow/interfaces/WorkflowExecuteOptions.md#property-durability). | [packages/workflow/src/types.ts:148](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L148) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | [packages/workflow/src/types.ts:143](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L143) |
| <a id="property-stream"></a> `stream?` | `readonly` | [`StreamMode`](/api/@graphorin/workflow/type-aliases/StreamMode.md) | - | [packages/workflow/src/types.ts:142](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/types.ts#L142) |
