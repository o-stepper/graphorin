[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WorkflowTimerDriverLike

# Interface: WorkflowTimerDriverLike

Defined in: [packages/server/src/workflows/timer-daemon.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L21)

Structural slice of `@graphorin/workflow`'s `TimerDriver` the daemon
consumes.

## Stable

## Methods

### start()

```ts
start(): void;
```

Defined in: [packages/server/src/workflows/timer-daemon.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L22)

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

Defined in: [packages/server/src/workflows/timer-daemon.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L24)

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
| `errors` | `number` | [packages/server/src/workflows/timer-daemon.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L28) |
| `fired` | `number` | [packages/server/src/workflows/timer-daemon.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L27) |
| `lastSweepAt?` | `number` | [packages/server/src/workflows/timer-daemon.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L29) |
| `nextWakeAt?` | `number` | [packages/server/src/workflows/timer-daemon.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L30) |
| `running` | `boolean` | [packages/server/src/workflows/timer-daemon.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L25) |
| `sweeps` | `number` | [packages/server/src/workflows/timer-daemon.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L26) |

***

### stop()

```ts
stop(): void;
```

Defined in: [packages/server/src/workflows/timer-daemon.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L23)

#### Returns

`void`

***

### sweep()

```ts
sweep(): Promise<number>;
```

Defined in: [packages/server/src/workflows/timer-daemon.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/workflows/timer-daemon.ts#L32)

#### Returns

`Promise`\&lt;`number`\&gt;
