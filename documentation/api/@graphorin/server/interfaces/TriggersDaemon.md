[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / TriggersDaemon

# Interface: TriggersDaemon

Defined in: [packages/server/src/triggers/daemon.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/triggers/daemon.ts#L67)

Stateful handle returned by [createTriggersDaemon](/api/@graphorin/server/functions/createTriggersDaemon.md). The
`start()` / `stop()` methods are wired into
`LifecycleHooks.beforeStart` / `beforeShutdown` by `createServer`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-scheduler"></a> `scheduler` | `readonly` | [`Scheduler`](/api/@graphorin/triggers/interfaces/Scheduler.md) | [packages/server/src/triggers/daemon.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/triggers/daemon.ts#L72) |

## Methods

### metrics()

```ts
metrics(): TriggersDaemonMetrics;
```

Defined in: [packages/server/src/triggers/daemon.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/triggers/daemon.ts#L71)

#### Returns

[`TriggersDaemonMetrics`](/api/@graphorin/server/interfaces/TriggersDaemonMetrics.md)

***

### start()

```ts
start(): Promise<void>;
```

Defined in: [packages/server/src/triggers/daemon.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/triggers/daemon.ts#L68)

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<TriggersDaemonStatus>;
```

Defined in: [packages/server/src/triggers/daemon.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/triggers/daemon.ts#L70)

#### Returns

`Promise`\&lt;[`TriggersDaemonStatus`](/api/@graphorin/server/interfaces/TriggersDaemonStatus.md)\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [packages/server/src/triggers/daemon.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/triggers/daemon.ts#L69)

#### Returns

`Promise`\&lt;`void`\&gt;
