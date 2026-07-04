[**Graphorin API reference v0.5.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [errors](/api/@graphorin/workflow/errors/index.md) / WorkflowErrorCode

# Type Alias: WorkflowErrorCode

```ts
type WorkflowErrorCode = 
  | "invalid-config"
  | "invalid-channel-write"
  | "multi-write-into-latest-value"
  | "unknown-node"
  | "thread-not-found"
  | "checkpoint-not-found"
  | "checkpoint-version-conflict"
  | "resume-without-suspension"
  | "concurrent-resume-rejected"
  | "workflow-aborted"
  | "workflow-cancel-timeout"
  | "max-steps-exceeded"
  | "node-execution-failed"
  | "reducer-failed"
  | "state-validation-failed"
  | "dead-end"
  | "state-not-serializable"
  | "node-timeout"
  | "workflow-version-mismatch"
  | "workflow-divergence"
  | "pause-not-found";
```

Defined in: packages/workflow/src/errors/index.ts:16

Stable `code` discriminator on every [WorkflowError](/api/@graphorin/workflow/errors/classes/WorkflowError.md) subclass.
Treat as a string literal union for `switch (err.code)` style code.

## Stable
