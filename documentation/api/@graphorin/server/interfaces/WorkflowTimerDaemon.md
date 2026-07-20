[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WorkflowTimerDaemon

# Interface: WorkflowTimerDaemon

Defined in: packages/server/src/workflows/timer-daemon.ts:60

**`Stable`**

Stateful handle returned by [createWorkflowTimerDaemon](/api/@graphorin/server/functions/createWorkflowTimerDaemon.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-driver"></a> `driver` | `readonly` | [`WorkflowTimerDriverLike`](/api/@graphorin/server/interfaces/WorkflowTimerDriverLike.md) | packages/server/src/workflows/timer-daemon.ts:64 |

## Methods

### start()

```ts
start(): Promise<void>;
```

Defined in: packages/server/src/workflows/timer-daemon.ts:61

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<WorkflowTimerDaemonStatus>;
```

Defined in: packages/server/src/workflows/timer-daemon.ts:63

#### Returns

`Promise`\&lt;[`WorkflowTimerDaemonStatus`](/api/@graphorin/server/interfaces/WorkflowTimerDaemonStatus.md)\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: packages/server/src/workflows/timer-daemon.ts:62

#### Returns

`Promise`\&lt;`void`\&gt;
