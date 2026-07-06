[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WorkflowTimerDaemon

# Interface: WorkflowTimerDaemon

Defined in: [packages/server/src/workflows/timer-daemon.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L60)

Stateful handle returned by [createWorkflowTimerDaemon](/api/@graphorin/server/functions/createWorkflowTimerDaemon.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-driver"></a> `driver` | `readonly` | [`WorkflowTimerDriverLike`](/api/@graphorin/server/interfaces/WorkflowTimerDriverLike.md) | [packages/server/src/workflows/timer-daemon.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L64) |

## Methods

### start()

```ts
start(): Promise<void>;
```

Defined in: [packages/server/src/workflows/timer-daemon.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L61)

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<WorkflowTimerDaemonStatus>;
```

Defined in: [packages/server/src/workflows/timer-daemon.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L63)

#### Returns

`Promise`\&lt;[`WorkflowTimerDaemonStatus`](/api/@graphorin/server/interfaces/WorkflowTimerDaemonStatus.md)\&gt;

***

### stop()

```ts
stop(): Promise<void>;
```

Defined in: [packages/server/src/workflows/timer-daemon.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L62)

#### Returns

`Promise`\&lt;`void`\&gt;
