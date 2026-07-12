[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / Scheduler

# Interface: Scheduler

Defined in: [packages/triggers/src/index.ts:234](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L234)

Public Scheduler surface.

## Stable

## Methods

### emit()

```ts
emit(eventName, payload?): Promise<void>;
```

Defined in: [packages/triggers/src/index.ts:241](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L241)

Emit `eventName` to every registered `event` trigger.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `eventName` | `string` |
| `payload?` | `unknown` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### events()

```ts
events(): AsyncIterable<SchedulerEvent>;
```

Defined in: [packages/triggers/src/index.ts:252](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L252)

AsyncIterable lifecycle event stream.

#### Returns

`AsyncIterable`\&lt;[`SchedulerEvent`](/api/@graphorin/triggers/type-aliases/SchedulerEvent.md)\&gt;

***

### fire()

```ts
fire(id, payload?): Promise<void>;
```

Defined in: [packages/triggers/src/index.ts:243](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L243)

Manually fire `id` (used by `graphorin triggers fire`, Phase 15).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `payload?` | `unknown` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### list()

```ts
list(): Promise<readonly TriggerState[]>;
```

Defined in: [packages/triggers/src/index.ts:237](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L237)

#### Returns

`Promise`\&lt;readonly [`TriggerState`](/api/@graphorin/core/interfaces/TriggerState.md)[]\&gt;

***

### orphans()

```ts
orphans(): Promise<readonly TriggerState[]>;
```

Defined in: [packages/triggers/src/index.ts:261](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L261)

Persisted trigger rows with no live declaration in this process
(W-123). These never fire: the callback only exists in memory, so
a row survives only as dead weight until the declaration is
re-registered or the row is pruned.

#### Returns

`Promise`\&lt;readonly [`TriggerState`](/api/@graphorin/core/interfaces/TriggerState.md)[]\&gt;

***

### recordActivity()

```ts
recordActivity(): void;
```

Defined in: [packages/triggers/src/index.ts:254](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L254)

Notify the scheduler that the user / runtime is no longer idle.

#### Returns

`void`

***

### register()

```ts
register(declaration): Promise<TriggerState>;
```

Defined in: [packages/triggers/src/index.ts:235](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L235)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `declaration` | [`TriggerDeclaration`](/api/@graphorin/triggers/interfaces/TriggerDeclaration.md) |

#### Returns

`Promise`\&lt;[`TriggerState`](/api/@graphorin/core/interfaces/TriggerState.md)\&gt;

***

### setDisabled()

```ts
setDisabled(id, disabled): Promise<TriggerState>;
```

Defined in: [packages/triggers/src/index.ts:250](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L250)

Flip the persistent `disabled` flag (IP-17). Disabling cancels the
armed timer but keeps the trigger registered + persisted; enabling
recomputes the next fire from now and re-arms. The destructive
removal is `unregister(...)`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `disabled` | `boolean` |

#### Returns

`Promise`\&lt;[`TriggerState`](/api/@graphorin/core/interfaces/TriggerState.md)\&gt;

***

### start()

```ts
start(): Promise<void>;
```

Defined in: [packages/triggers/src/index.ts:238](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L238)

#### Returns

`Promise`\&lt;`void`\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [packages/triggers/src/index.ts:239](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L239)

#### Returns

`Promise`\&lt;`void`\&gt;

***

### unregister()

```ts
unregister(id): Promise<void>;
```

Defined in: [packages/triggers/src/index.ts:236](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L236)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
