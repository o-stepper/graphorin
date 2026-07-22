[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / audit

# audit

Audit-event emitter + counter registry for `@graphorin/tools`.

Two surfaces:

- `emitToolAudit(...)` / `onToolAudit(...)` - sanitized audit-event
  broadcasting, mirroring the discipline used by `@graphorin/security`.
- `incrementCounter(...)` / `snapshotCounters(...)` - in-process
  metrics registry exported through [CounterSnapshot](/api/@graphorin/tools/interfaces/CounterSnapshot.md).

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ToolAuditActor](/api/@graphorin/tools/audit/interfaces/ToolAuditActor.md) | Lightweight actor descriptor for tool-subsystem audit events. |
| [ToolAuditEvent](/api/@graphorin/tools/audit/interfaces/ToolAuditEvent.md) | Sanitized payload emitted by the tool subsystem. Listeners receive only metadata that is safe to log - the actual tool args, the matched bytes, the secret values are NEVER forwarded. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [ToolAuditAction](/api/@graphorin/tools/audit/type-aliases/ToolAuditAction.md) | Discriminator for the audit-event family emitted by the tools subsystem. |
| [ToolAuditDecision](/api/@graphorin/tools/audit/type-aliases/ToolAuditDecision.md) | Decision recorded by an audit event. |
| [ToolAuditListener](/api/@graphorin/tools/audit/type-aliases/ToolAuditListener.md) | Callback shape accepted by [onToolAudit](/api/@graphorin/tools/audit/functions/onToolAudit.md). |

## Functions

| Function | Description |
| ------ | ------ |
| [\_getToolAuditListenerCountForTesting](/api/@graphorin/tools/audit/functions/getToolAuditListenerCountForTesting.md) | Snapshot of currently-registered listener count. Used by tests. |
| [\_resetToolAuditListenersForTesting](/api/@graphorin/tools/audit/functions/resetToolAuditListenersForTesting.md) | Reset listener registry. Used by tests. |
| [createRegisteredEvent](/api/@graphorin/tools/audit/functions/createRegisteredEvent.md) | Convenience factory for the `tool:registered` audit row. Carries the resolved trust class + side-effect class + per-tool fields the downstream cassette / replay layers care about. |
| [emitToolAudit](/api/@graphorin/tools/audit/functions/emitToolAudit.md) | Emit an audit event. Never throws across listener boundaries - a listener that throws is isolated so it cannot tear down the tool execution path. |
| [onToolAudit](/api/@graphorin/tools/audit/functions/onToolAudit.md) | Subscribe to tool-subsystem audit events. Returns a teardown function that removes the listener; callers must invoke it on shutdown to avoid leaks in long-running server processes. |

## References

### CounterSnapshot

Re-exports [CounterSnapshot](/api/@graphorin/tools/interfaces/CounterSnapshot.md)

***

### getCounterForTesting

Re-exports [getCounterForTesting](/api/@graphorin/tools/functions/getCounterForTesting.md)

***

### getHistogramForTesting

Re-exports [getHistogramForTesting](/api/@graphorin/tools/functions/getHistogramForTesting.md)

***

### incrementCounter

Re-exports [incrementCounter](/api/@graphorin/tools/functions/incrementCounter.md)

***

### observeHistogram

Re-exports [observeHistogram](/api/@graphorin/tools/functions/observeHistogram.md)

***

### resetCountersForTesting

Re-exports [resetCountersForTesting](/api/@graphorin/tools/functions/resetCountersForTesting.md)

***

### setGauge

Re-exports [setGauge](/api/@graphorin/tools/functions/setGauge.md)

***

### snapshotCounters

Re-exports [snapshotCounters](/api/@graphorin/tools/functions/snapshotCounters.md)
