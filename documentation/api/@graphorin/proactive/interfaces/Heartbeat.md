[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / Heartbeat

# Interface: Heartbeat

Defined in: packages/proactive/src/heartbeat.ts:186

**`Stable`**

The heartbeat handle.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | The registered trigger id. | packages/proactive/src/heartbeat.ts:195 |

## Methods

### beat()

```ts
beat(): Promise<HeartbeatBeatResult>;
```

Defined in: packages/proactive/src/heartbeat.ts:192

Fire one beat now (also the trigger callback).

#### Returns

`Promise`\&lt;[`HeartbeatBeatResult`](/api/@graphorin/proactive/interfaces/HeartbeatBeatResult.md)\&gt;

***

### start()

```ts
start(): Promise<void>;
```

Defined in: packages/proactive/src/heartbeat.ts:188

Register the schedule on the scheduler. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): HeartbeatStatus;
```

Defined in: packages/proactive/src/heartbeat.ts:193

#### Returns

[`HeartbeatStatus`](/api/@graphorin/proactive/interfaces/HeartbeatStatus.md)

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: packages/proactive/src/heartbeat.ts:190

Unregister the schedule and cancel a pending deferral.

#### Returns

`Promise`\&lt;`void`\&gt;
