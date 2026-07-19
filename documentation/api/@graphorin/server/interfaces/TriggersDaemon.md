[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / TriggersDaemon

# Interface: TriggersDaemon

Defined in: packages/server/src/triggers/daemon.ts:72

**`Stable`**

Stateful handle returned by [createTriggersDaemon](/api/@graphorin/server/functions/createTriggersDaemon.md). The
`start()` / `stop()` methods are wired into
`LifecycleHooks.beforeStart` / `beforeShutdown` by `createServer`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-scheduler"></a> `scheduler` | `readonly` | [`Scheduler`](/api/@graphorin/triggers/interfaces/Scheduler.md) | packages/server/src/triggers/daemon.ts:77 |

## Methods

### metrics()

```ts
metrics(): TriggersDaemonMetrics;
```

Defined in: packages/server/src/triggers/daemon.ts:76

#### Returns

[`TriggersDaemonMetrics`](/api/@graphorin/server/interfaces/TriggersDaemonMetrics.md)

***

### start()

```ts
start(): Promise<void>;
```

Defined in: packages/server/src/triggers/daemon.ts:73

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<TriggersDaemonStatus>;
```

Defined in: packages/server/src/triggers/daemon.ts:75

#### Returns

`Promise`\&lt;[`TriggersDaemonStatus`](/api/@graphorin/server/interfaces/TriggersDaemonStatus.md)\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: packages/server/src/triggers/daemon.ts:74

#### Returns

`Promise`\&lt;`void`\&gt;
