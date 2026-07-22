[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WorkflowTimerDriverLike

# Interface: WorkflowTimerDriverLike

Defined in: packages/server/src/workflows/timer-daemon.ts:21

**`Stable`**

Structural slice of `@graphorin/workflow`'s `TimerDriver` the daemon
consumes.

## Methods

### start()

```ts
start(): void;
```

Defined in: packages/server/src/workflows/timer-daemon.ts:22

#### Returns

`void`

***

### status()

```ts
status(): {
  errors: number;
  fired: number;
  lastSweepAt?: number;
  nextWakeAt?: number;
  running: boolean;
  sweeps: number;
};
```

Defined in: packages/server/src/workflows/timer-daemon.ts:24

#### Returns

```ts
{
  errors: number;
  fired: number;
  lastSweepAt?: number;
  nextWakeAt?: number;
  running: boolean;
  sweeps: number;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `errors` | `number` | packages/server/src/workflows/timer-daemon.ts:28 |
| `fired` | `number` | packages/server/src/workflows/timer-daemon.ts:27 |
| `lastSweepAt?` | `number` | packages/server/src/workflows/timer-daemon.ts:29 |
| `nextWakeAt?` | `number` | packages/server/src/workflows/timer-daemon.ts:30 |
| `running` | `boolean` | packages/server/src/workflows/timer-daemon.ts:25 |
| `sweeps` | `number` | packages/server/src/workflows/timer-daemon.ts:26 |

***

### stop()

```ts
stop(): void;
```

Defined in: packages/server/src/workflows/timer-daemon.ts:23

#### Returns

`void`

***

### sweep()

```ts
sweep(): Promise<number>;
```

Defined in: packages/server/src/workflows/timer-daemon.ts:32

#### Returns

`Promise`\&lt;`number`\&gt;
