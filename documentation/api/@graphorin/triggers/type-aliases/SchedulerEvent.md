[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / SchedulerEvent

# Type Alias: SchedulerEvent

```ts
type SchedulerEvent = 
  | {
  type: "started";
}
  | {
  type: "stopped";
}
  | {
  id: string;
  kind: TriggerKind;
  type: "registered";
}
  | {
  firedAt: number;
  id: string;
  type: "fire-start";
}
  | {
  durationMs: number;
  id: string;
  type: "fire-end";
}
  | {
  durationMs: number;
  error: unknown;
  id: string;
  type: "fire-error";
}
  | {
  id: string;
  missed: number;
  type: "catchup-applied";
}
  | {
  id: string;
  type: "lib-mode-warning";
};
```

Defined in: [packages/triggers/src/index.ts:157](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L157)

Lifecycle event emitted by [Scheduler.events](/api/@graphorin/triggers/interfaces/Scheduler.md#events). Useful for
tests and for piping into observability without monkey-patching.

## Stable
