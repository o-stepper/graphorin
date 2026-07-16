[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / Heartbeat

# Interface: Heartbeat

Defined in: [packages/proactive/src/heartbeat.ts:186](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L186)

The heartbeat handle.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | The registered trigger id. | [packages/proactive/src/heartbeat.ts:195](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L195) |

## Methods

### beat()

```ts
beat(): Promise<HeartbeatBeatResult>;
```

Defined in: [packages/proactive/src/heartbeat.ts:192](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L192)

Fire one beat now (also the trigger callback).

#### Returns

`Promise`\&lt;[`HeartbeatBeatResult`](/api/@graphorin/proactive/interfaces/HeartbeatBeatResult.md)\&gt;

***

### start()

```ts
start(): Promise<void>;
```

Defined in: [packages/proactive/src/heartbeat.ts:188](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L188)

Register the schedule on the scheduler. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): HeartbeatStatus;
```

Defined in: [packages/proactive/src/heartbeat.ts:193](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L193)

#### Returns

[`HeartbeatStatus`](/api/@graphorin/proactive/interfaces/HeartbeatStatus.md)

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [packages/proactive/src/heartbeat.ts:190](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/heartbeat.ts#L190)

Unregister the schedule and cancel a pending deferral.

#### Returns

`Promise`\&lt;`void`\&gt;
