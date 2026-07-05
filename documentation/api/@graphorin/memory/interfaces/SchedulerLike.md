[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / SchedulerLike

# Interface: SchedulerLike

Defined in: packages/memory/src/consolidator/scheduler.ts:37

Subset of the `@graphorin/triggers` Scheduler surface the bridge
needs. Defined structurally so consumers can inject mocks in
tests without taking the package dependency.

## Stable

## Methods

### register()

```ts
register(declaration): Promise<unknown>;
```

Defined in: packages/memory/src/consolidator/scheduler.ts:38

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

Defined in: packages/memory/src/consolidator/scheduler.ts:39

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
