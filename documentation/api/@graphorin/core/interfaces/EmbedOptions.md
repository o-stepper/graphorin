[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / EmbedOptions

# Interface: EmbedOptions

Defined in: packages/core/src/contracts/embedder.ts:30

Per-call options for `EmbedderProvider.embed(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-requestid"></a> `requestId?` | `readonly` | `string` | Optional per-call request id forwarded to the trace span. | packages/core/src/contracts/embedder.ts:33 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/core/src/contracts/embedder.ts:31 |
