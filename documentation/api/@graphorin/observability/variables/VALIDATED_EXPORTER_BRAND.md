[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / VALIDATED\_EXPORTER\_BRAND

# Variable: VALIDATED\_EXPORTER\_BRAND

```ts
const VALIDATED_EXPORTER_BRAND: unique symbol;
```

Defined in: [packages/observability/src/exporters/types.ts:16](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/exporters/types.ts#L16)

Discriminator marker - every exporter that has been wrapped via
`withValidation(...)` is branded with this symbol so the tracer can
fail-fast at startup when a raw exporter is registered.

## Stable
