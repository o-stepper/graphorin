[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / TriggersDaemon

# Interface: TriggersDaemon

Defined in: packages/server/src/triggers/daemon.ts:67

Stateful handle returned by [createTriggersDaemon](/api/@graphorin/server/functions/createTriggersDaemon.md). The
`start()` / `stop()` methods are wired into
`LifecycleHooks.beforeStart` / `beforeShutdown` by `createServer`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-scheduler"></a> `scheduler` | `readonly` | [`Scheduler`](/api/@graphorin/triggers/interfaces/Scheduler.md) | packages/server/src/triggers/daemon.ts:72 |

## Methods

### metrics()

```ts
metrics(): TriggersDaemonMetrics;
```

Defined in: packages/server/src/triggers/daemon.ts:71

#### Returns

[`TriggersDaemonMetrics`](/api/@graphorin/server/interfaces/TriggersDaemonMetrics.md)

***

### start()

```ts
start(): Promise<void>;
```

Defined in: packages/server/src/triggers/daemon.ts:68

#### Returns

`Promise`\<`void`\>

***

### status()

```ts
status(): Promise<TriggersDaemonStatus>;
```

Defined in: packages/server/src/triggers/daemon.ts:70

#### Returns

`Promise`\<[`TriggersDaemonStatus`](/api/@graphorin/server/interfaces/TriggersDaemonStatus.md)\>

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: packages/server/src/triggers/daemon.ts:69

#### Returns

`Promise`\<`void`\>
