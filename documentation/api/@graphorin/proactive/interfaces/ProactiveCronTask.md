[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / ProactiveCronTask

# Interface: ProactiveCronTask

Defined in: packages/proactive/src/cron-task.ts:212

**`Stable`**

The cron-leg task handle.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/proactive/src/cron-task.ts:213 |

## Methods

### fire()

```ts
fire(): Promise<ProactiveTaskFireResult>;
```

Defined in: packages/proactive/src/cron-task.ts:219

Fire once now (also the trigger callback).

#### Returns

`Promise`\&lt;[`ProactiveTaskFireResult`](/api/@graphorin/proactive/interfaces/ProactiveTaskFireResult.md)\&gt;

***

### start()

```ts
start(): Promise<void>;
```

Defined in: packages/proactive/src/cron-task.ts:215

Register the schedule on the scheduler. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): ProactiveCronTaskStatus;
```

Defined in: packages/proactive/src/cron-task.ts:220

#### Returns

[`ProactiveCronTaskStatus`](/api/@graphorin/proactive/interfaces/ProactiveCronTaskStatus.md)

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: packages/proactive/src/cron-task.ts:217

Unregister the schedule.

#### Returns

`Promise`\&lt;`void`\&gt;
