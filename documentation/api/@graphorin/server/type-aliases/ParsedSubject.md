[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ParsedSubject

# Type Alias: ParsedSubject

```ts
type ParsedSubject = 
  | {
  kind: "session-events";
  sessionId: string;
}
  | {
  kind: "session-run-events";
  runId: string;
  sessionId: string;
}
  | {
  agentId: string;
  kind: "agent-run-events";
  runId: string;
}
  | {
  kind: "workflow-events";
  workflowId: string;
}
  | {
  kind: "workflow-run-events";
  runId: string;
  workflowId: string;
}
  | {
  kind: "memory-conflicts";
}
  | {
  kind: "audit-events";
};
```

Defined in: [packages/server/src/ws/subjects.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/subjects.ts#L25)

Discriminated union of every recognised subject form. Surfaced on
audit log entries + diagnostics; the wire still carries the raw
string.

## Stable
