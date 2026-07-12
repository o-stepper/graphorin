[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / ProactiveCronTask

# Interface: ProactiveCronTask

Defined in: [packages/proactive/src/cron-task.ts:211](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L211)

The cron-leg task handle.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/proactive/src/cron-task.ts:212](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L212) |

## Methods

### fire()

```ts
fire(): Promise<ProactiveTaskFireResult>;
```

Defined in: [packages/proactive/src/cron-task.ts:218](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L218)

Fire once now (also the trigger callback).

#### Returns

`Promise`\&lt;[`ProactiveTaskFireResult`](/api/@graphorin/proactive/interfaces/ProactiveTaskFireResult.md)\&gt;

***

### start()

```ts
start(): Promise<void>;
```

Defined in: [packages/proactive/src/cron-task.ts:214](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L214)

Register the schedule on the scheduler. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): ProactiveCronTaskStatus;
```

Defined in: [packages/proactive/src/cron-task.ts:219](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L219)

#### Returns

[`ProactiveCronTaskStatus`](/api/@graphorin/proactive/interfaces/ProactiveCronTaskStatus.md)

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [packages/proactive/src/cron-task.ts:216](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/cron-task.ts#L216)

Unregister the schedule.

#### Returns

`Promise`\&lt;`void`\&gt;
