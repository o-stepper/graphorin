[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / createTracer

# Function: createTracer()

```ts
function createTracer(opts): GraphorinTracer;
```

Defined in: [packages/observability/src/tracer/tracer.ts:118](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/tracer/tracer.ts#L118)

Build a [GraphorinTracer](/api/@graphorin/observability/interfaces/GraphorinTracer.md) from the supplied options. Every
exporter passed in must already be wrapped via
`withValidation(...)` OR `validation` must be set to a concrete
options object so the tracer can auto-wrap on your behalf.
Registering a raw exporter while `validation: 'off'` triggers an
[UnvalidatedExporterError](/api/@graphorin/observability/classes/UnvalidatedExporterError.md) at startup.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`TracerOptions`](/api/@graphorin/observability/interfaces/TracerOptions.md) |

## Returns

[`GraphorinTracer`](/api/@graphorin/observability/interfaces/GraphorinTracer.md)

## Stable
