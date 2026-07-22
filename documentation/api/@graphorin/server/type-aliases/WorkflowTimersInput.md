[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / WorkflowTimersInput

# Type Alias: WorkflowTimersInput

```ts
type WorkflowTimersInput = 
  | {
  daemon: WorkflowTimerDaemon;
}
  | {
  driver: WorkflowTimerDriverLike;
};
```

Defined in: packages/server/src/app-daemons.ts:32

Accepted forms for `createServer({ workflowTimers })`.
