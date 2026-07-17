[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / TickableWorkflow

# Interface: TickableWorkflow

Defined in: [packages/workflow/src/timer-driver.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/timer-driver.ts#L22)

The slice of [Workflow](/api/@graphorin/workflow/interfaces/Workflow.md) the driver needs (structural).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | [packages/workflow/src/timer-driver.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/timer-driver.ts#L23) |

## Methods

### tick()

```ts
tick(threadId, opts?): Promise<{
  fired: boolean;
  nextWakeAt: number | null;
}>;
```

Defined in: [packages/workflow/src/timer-driver.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/timer-driver.ts#L24)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `opts?` | \{ `now?`: `number`; \} |
| `opts.now?` | `number` |

#### Returns

`Promise`\<\{
  `fired`: `boolean`;
  `nextWakeAt`: `number` \| `null`;
\}\>
