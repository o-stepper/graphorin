[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / DEFAULT\_VALIDATION\_CONFIG

# Variable: DEFAULT\_VALIDATION\_CONFIG

```ts
const DEFAULT_VALIDATION_CONFIG: Required<Pick<ValidationConfig, "minTier" | "failOnUnredactedSensitive">>;
```

Defined in: [packages/observability/src/redaction/config.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/redaction/config.ts#L45)

Default validation configuration. Mirrors the runtime defaults used
by `createTracer({ ... })` when `validation` is omitted.

## Stable
