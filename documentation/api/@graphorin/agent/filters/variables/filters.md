[**Graphorin API reference v0.5.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [filters](/api/@graphorin/agent/filters/index.md) / filters

# Variable: filters

```ts
const filters: {
  bySensitivity: (args) => DescribedFilter;
  compose: (...filters) => DescribedFilter;
  custom: (fn, meta?) => DescribedFilter;
  defaultHandoffFilter: () => DescribedFilter;
  full: () => DescribedFilter;
  lastN: (n) => DescribedFilter;
  lastUser: () => DescribedFilter;
  stripReasoning: () => DescribedFilter;
  stripSensitiveOutputs: () => DescribedFilter;
  stripToolCalls: () => DescribedFilter;
  summary: (text) => DescribedFilter;
};
```

Defined in: packages/agent/src/filters/index.ts:335

Aggregate module export.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-bysensitivity"></a> `bySensitivity()` | (`args`) => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | packages/agent/src/filters/index.ts:340 |
| <a id="property-compose"></a> `compose()` | (...`filters`) => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | packages/agent/src/filters/index.ts:344 |
| <a id="property-custom"></a> `custom()` | (`fn`, `meta?`) => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | packages/agent/src/filters/index.ts:345 |
| <a id="property-defaulthandofffilter"></a> `defaultHandoffFilter()` | () => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | packages/agent/src/filters/index.ts:346 |
| <a id="property-full"></a> `full()` | () => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | packages/agent/src/filters/index.ts:338 |
| <a id="property-lastn"></a> `lastN()` | (`n`) => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | packages/agent/src/filters/index.ts:336 |
| <a id="property-lastuser"></a> `lastUser()` | () => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | packages/agent/src/filters/index.ts:337 |
| <a id="property-stripreasoning"></a> `stripReasoning()` | () => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | packages/agent/src/filters/index.ts:341 |
| <a id="property-stripsensitiveoutputs"></a> `stripSensitiveOutputs()` | () => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | packages/agent/src/filters/index.ts:342 |
| <a id="property-striptoolcalls"></a> `stripToolCalls()` | () => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | packages/agent/src/filters/index.ts:343 |
| <a id="property-summary"></a> `summary()` | (`text`) => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | packages/agent/src/filters/index.ts:339 |
