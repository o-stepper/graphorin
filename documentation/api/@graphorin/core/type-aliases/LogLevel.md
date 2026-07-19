[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / LogLevel

# Type Alias: LogLevel

```ts
type LogLevel = "trace" | "debug" | "info" | "warn" | "error";
```

Defined in: packages/core/src/contracts/logger.ts:8

**`Stable`**

Severity levels supported by the project logger. Mirrors the canonical
`trace < debug < info < warn < error` hierarchy used by every common
structured logger.
