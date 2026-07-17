[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / TimerDriverEntry

# Interface: TimerDriverEntry

Defined in: [packages/workflow/src/timer-driver.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/timer-driver.ts#L31)

One workflow the driver polls, paired with its checkpoint store.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-checkpointstore"></a> `checkpointStore` | `readonly` | [`CheckpointStore`](/api/@graphorin/workflow/interfaces/CheckpointStore.md) | [packages/workflow/src/timer-driver.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/timer-driver.ts#L33) |
| <a id="property-workflow"></a> `workflow` | `readonly` | [`TickableWorkflow`](/api/@graphorin/workflow/interfaces/TickableWorkflow.md) | [packages/workflow/src/timer-driver.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/timer-driver.ts#L32) |
