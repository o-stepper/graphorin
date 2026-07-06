[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WorkflowTimerDaemon

# Interface: WorkflowTimerDaemon

Defined in: packages/server/src/workflows/timer-daemon.ts:60

Stateful handle returned by [createWorkflowTimerDaemon](/api/@graphorin/server/functions/createWorkflowTimerDaemon.md).

## Stable

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

`Promise`\<`void`\>

***

### status()

```ts
status(): Promise<WorkflowTimerDaemonStatus>;
```

Defined in: packages/server/src/workflows/timer-daemon.ts:63

#### Returns

`Promise`\<[`WorkflowTimerDaemonStatus`](/api/@graphorin/server/interfaces/WorkflowTimerDaemonStatus.md)\>

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: packages/server/src/workflows/timer-daemon.ts:62

#### Returns

`Promise`\<`void`\>
