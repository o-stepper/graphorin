[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / TriggersDaemonInput

# Type Alias: TriggersDaemonInput

```ts
type TriggersDaemonInput = 
  | {
  daemon: TriggersDaemon;
}
  | {
  scheduler: Scheduler;
};
```

Defined in: [packages/server/src/app-daemons.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/app-daemons.ts#L25)

Discriminated union accepted by `CreateServerOptions.triggers`. A
caller may either supply a fully-built daemon (e.g. constructed
around a custom `Scheduler`) or just the underlying scheduler - the
server wraps it with [createTriggersDaemon](/api/@graphorin/server/functions/createTriggersDaemon.md) automatically.

## Stable
