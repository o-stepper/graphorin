[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / WithFallbackOptions

# Interface: WithFallbackOptions

Defined in: packages/provider/src/middleware/with-fallback.ts:21

Options for [withFallback](/api/@graphorin/provider/variables/withFallback.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-fallbacks"></a> `fallbacks` | `readonly` | readonly [`Provider`](/api/@graphorin/core/interfaces/Provider.md)[] | Alternate providers tried in order. | packages/provider/src/middleware/with-fallback.ts:23 |
| <a id="property-logger"></a> `logger?` | `readonly` | (`message`, `meta?`) => `void` | Optional log sink; defaults to `console.warn`. | packages/provider/src/middleware/with-fallback.ts:27 |
| <a id="property-shouldfallback"></a> `shouldFallback?` | `readonly` | (`err`) => `boolean` | Predicate deciding whether an error should trigger a fallback. | packages/provider/src/middleware/with-fallback.ts:25 |
