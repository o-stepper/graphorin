[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / LogFields

# Type Alias: LogFields

```ts
type LogFields = Readonly<Record<string, unknown>>;
```

Defined in: [packages/core/src/contracts/logger.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/logger.ts#L17)

Free-form structured fields that accompany a log record. Values must be
JSON-serializable; concrete loggers redact `SecretValue` and other
sensitive shapes per the framework's redaction policy.

## Stable
