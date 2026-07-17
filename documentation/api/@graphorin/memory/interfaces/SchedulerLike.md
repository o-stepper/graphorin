[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SchedulerLike

# Interface: SchedulerLike

Defined in: [packages/memory/src/consolidator/scheduler.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L50)

Subset of the `@graphorin/triggers` Scheduler surface the bridge
needs. Defined structurally so consumers can inject mocks in
tests without taking the package dependency.

## Stable

## Methods

### register()

```ts
register(declaration): Promise<unknown>;
```

Defined in: [packages/memory/src/consolidator/scheduler.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L51)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `declaration` | [`TriggerDeclarationLike`](/api/@graphorin/memory/interfaces/TriggerDeclarationLike.md) |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### unregister()?

```ts
optional unregister(id): Promise<void>;
```

Defined in: [packages/memory/src/consolidator/scheduler.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/scheduler.ts#L52)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
