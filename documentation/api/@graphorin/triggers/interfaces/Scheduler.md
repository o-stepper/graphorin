[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / Scheduler

# Interface: Scheduler

Defined in: [packages/triggers/src/index.ts:338](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L338)

Public Scheduler surface.

## Stable

## Methods

### emit()

```ts
emit(eventName, payload?): Promise<void>;
```

Defined in: [packages/triggers/src/index.ts:345](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L345)

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

Defined in: [packages/triggers/src/index.ts:356](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L356)

AsyncIterable lifecycle event stream.

#### Returns

`AsyncIterable`\&lt;[`SchedulerEvent`](/api/@graphorin/triggers/type-aliases/SchedulerEvent.md)\&gt;

***

### fire()

```ts
fire(id, payload?): Promise<void>;
```

Defined in: [packages/triggers/src/index.ts:347](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L347)

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

Defined in: [packages/triggers/src/index.ts:341](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L341)

#### Returns

`Promise`\&lt;readonly [`TriggerState`](/api/@graphorin/core/interfaces/TriggerState.md)[]\&gt;

***

### orphans()

```ts
orphans(): Promise<readonly TriggerState[]>;
```

Defined in: [packages/triggers/src/index.ts:365](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L365)

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

Defined in: [packages/triggers/src/index.ts:358](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L358)

Notify the scheduler that the user / runtime is no longer idle.

#### Returns

`void`

***

### register()

```ts
register(declaration): Promise<TriggerState>;
```

Defined in: [packages/triggers/src/index.ts:339](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L339)

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

Defined in: [packages/triggers/src/index.ts:354](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L354)

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

Defined in: [packages/triggers/src/index.ts:342](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L342)

#### Returns

`Promise`\&lt;`void`\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [packages/triggers/src/index.ts:343](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L343)

#### Returns

`Promise`\&lt;`void`\&gt;

***

### unregister()

```ts
unregister(id): Promise<void>;
```

Defined in: [packages/triggers/src/index.ts:340](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L340)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
