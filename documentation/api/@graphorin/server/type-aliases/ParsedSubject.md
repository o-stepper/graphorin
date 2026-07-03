[**Graphorin API reference v0.5.0**](../../../index.md)

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

Defined in: packages/server/src/ws/subjects.ts:25

Discriminated union of every recognised subject form. Surfaced on
audit log entries + diagnostics; the wire still carries the raw
string.

## Stable
