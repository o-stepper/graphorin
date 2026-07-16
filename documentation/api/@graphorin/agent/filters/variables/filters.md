[**Graphorin API reference v0.10.0**](../../../../index.md)

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

Defined in: [packages/agent/src/filters/index.ts:335](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L335)

Aggregate module export.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-bysensitivity"></a> `bySensitivity()` | (`args`) => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | [packages/agent/src/filters/index.ts:340](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L340) |
| <a id="property-compose"></a> `compose()` | (...`filters`) => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | [packages/agent/src/filters/index.ts:344](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L344) |
| <a id="property-custom"></a> `custom()` | (`fn`, `meta?`) => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | [packages/agent/src/filters/index.ts:345](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L345) |
| <a id="property-defaulthandofffilter"></a> `defaultHandoffFilter()` | () => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | [packages/agent/src/filters/index.ts:346](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L346) |
| <a id="property-full"></a> `full()` | () => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | [packages/agent/src/filters/index.ts:338](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L338) |
| <a id="property-lastn"></a> `lastN()` | (`n`) => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | [packages/agent/src/filters/index.ts:336](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L336) |
| <a id="property-lastuser"></a> `lastUser()` | () => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | [packages/agent/src/filters/index.ts:337](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L337) |
| <a id="property-stripreasoning"></a> `stripReasoning()` | () => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | [packages/agent/src/filters/index.ts:341](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L341) |
| <a id="property-stripsensitiveoutputs"></a> `stripSensitiveOutputs()` | () => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | [packages/agent/src/filters/index.ts:342](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L342) |
| <a id="property-striptoolcalls"></a> `stripToolCalls()` | () => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | [packages/agent/src/filters/index.ts:343](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L343) |
| <a id="property-summary"></a> `summary()` | (`text`) => [`DescribedFilter`](/api/@graphorin/agent/filters/interfaces/DescribedFilter.md) | [packages/agent/src/filters/index.ts:339](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/filters/index.ts#L339) |
