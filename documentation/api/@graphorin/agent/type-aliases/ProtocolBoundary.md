[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / ProtocolBoundary

# Type Alias: ProtocolBoundary

```ts
type ProtocolBoundary = "sse" | "http-header" | "ws" | "rest-body" | "audit";
```

Defined in: [packages/agent/src/lateral-leak/protocol-guard.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/lateral-leak/protocol-guard.ts#L30)

Per-boundary identifier used by the runtime when calling the
guard.

## Stable
