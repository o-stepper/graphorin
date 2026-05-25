[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / Scheduler

# Interface: Scheduler

Defined in: packages/triggers/src/index.ts:195

Public Scheduler surface.

## Stable

## Methods

### emit()

```ts
emit(eventName, payload?): Promise<void>;
```

Defined in: packages/triggers/src/index.ts:202

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

Defined in: packages/triggers/src/index.ts:206

AsyncIterable lifecycle event stream.

#### Returns

`AsyncIterable`\&lt;[`SchedulerEvent`](/api/@graphorin/triggers/type-aliases/SchedulerEvent.md)\&gt;

***

### fire()

```ts
fire(id, payload?): Promise<void>;
```

Defined in: packages/triggers/src/index.ts:204

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

Defined in: packages/triggers/src/index.ts:198

#### Returns

`Promise`\&lt;readonly [`TriggerState`](/api/@graphorin/core/interfaces/TriggerState.md)[]\&gt;

***

### recordActivity()

```ts
recordActivity(): void;
```

Defined in: packages/triggers/src/index.ts:208

Notify the scheduler that the user / runtime is no longer idle.

#### Returns

`void`

***

### register()

```ts
register(declaration): Promise<TriggerState>;
```

Defined in: packages/triggers/src/index.ts:196

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `declaration` | [`TriggerDeclaration`](/api/@graphorin/triggers/interfaces/TriggerDeclaration.md) |

#### Returns

`Promise`\&lt;[`TriggerState`](/api/@graphorin/core/interfaces/TriggerState.md)\&gt;

***

### start()

```ts
start(): Promise<void>;
```

Defined in: packages/triggers/src/index.ts:199

#### Returns

`Promise`\&lt;`void`\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: packages/triggers/src/index.ts:200

#### Returns

`Promise`\&lt;`void`\&gt;

***

### unregister()

```ts
unregister(id): Promise<void>;
```

Defined in: packages/triggers/src/index.ts:197

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
