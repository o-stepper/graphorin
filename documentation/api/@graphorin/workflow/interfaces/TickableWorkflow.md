[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / TickableWorkflow

# Interface: TickableWorkflow

Defined in: packages/workflow/src/timer-driver.ts:22

The slice of [Workflow](/api/@graphorin/workflow/interfaces/Workflow.md) the driver needs (structural).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/workflow/src/timer-driver.ts:23 |

## Methods

### tick()

```ts
tick(threadId, opts?): Promise<{
  fired: boolean;
  nextWakeAt: number | null;
}>;
```

Defined in: packages/workflow/src/timer-driver.ts:24

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
