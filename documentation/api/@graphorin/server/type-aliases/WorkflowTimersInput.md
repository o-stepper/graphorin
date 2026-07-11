[**Graphorin API reference v0.8.0**](../../../index.md)

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

Defined in: [packages/server/src/app-daemons.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/app-daemons.ts#L30)

W-032: accepted forms for `createServer({ workflowTimers })`.
