[**Graphorin API reference v0.9.0**](../../../index.md)

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
}
  | {
  id: string;
  type: "orphaned";
}
  | {
  id: string;
  type: "expired";
};
```

Defined in: [packages/triggers/src/index.ts:250](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L250)

Lifecycle event emitted by [Scheduler.events](/api/@graphorin/triggers/interfaces/Scheduler.md#events). Useful for
tests and for piping into observability without monkey-patching.

## Union Members

### Type Literal

```ts
{
  type: "started";
}
```

***

### Type Literal

```ts
{
  type: "stopped";
}
```

***

### Type Literal

```ts
{
  id: string;
  kind: TriggerKind;
  type: "registered";
}
```

***

### Type Literal

```ts
{
  firedAt: number;
  id: string;
  type: "fire-start";
}
```

***

### Type Literal

```ts
{
  durationMs: number;
  id: string;
  type: "fire-end";
}
```

***

### Type Literal

```ts
{
  durationMs: number;
  error: unknown;
  id: string;
  type: "fire-error";
}
```

***

### Type Literal

```ts
{
  id: string;
  missed: number;
  type: "catchup-applied";
}
```

***

### Type Literal

```ts
{
  id: string;
  type: "lib-mode-warning";
}
```

***

### Type Literal

```ts
{
  id: string;
  type: "orphaned";
}
```

A persisted trigger row has no re-registered declaration in this
process (W-123). It will never fire; re-register the declaration
or prune the row (`POST /v1/triggers/prune { "orphaned": true }`).

***

### Type Literal

```ts
{
  id: string;
  type: "expired";
}
```

The trigger's `expiresAt` instant passed, so the scheduler
auto-paused it (C4): the persistent `disabled` flag is set instead
of firing the callback. Renew with a later `expiresAt` +
`setDisabled(id, false)`, or prune it
(`POST /v1/triggers/prune { "disabled": true }`).

## Stable
