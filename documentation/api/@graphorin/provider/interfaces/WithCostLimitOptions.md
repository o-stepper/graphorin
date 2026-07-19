[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / WithCostLimitOptions

# Interface: WithCostLimitOptions

Defined in: packages/provider/src/middleware/with-cost-limit.ts:22

**`Stable`**

Options for [withCostLimit](/api/@graphorin/provider/variables/withCostLimit.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-logger"></a> `logger?` | `readonly` | (`message`, `meta?`) => `void` | Optional sink for `'warn'` mode. Defaults to `console.warn`. | packages/provider/src/middleware/with-cost-limit.ts:43 |
| <a id="property-maxperhour"></a> `maxPerHour?` | `readonly` | `number` | Maximum cumulative USD cost per hour. | packages/provider/src/middleware/with-cost-limit.ts:28 |
| <a id="property-maxperrun"></a> `maxPerRun?` | `readonly` | `number` | Maximum cumulative USD cost per run. | packages/provider/src/middleware/with-cost-limit.ts:26 |
| <a id="property-maxpersession"></a> `maxPerSession?` | `readonly` | `number` | Maximum cumulative USD cost per session. | packages/provider/src/middleware/with-cost-limit.ts:24 |
| <a id="property-onexceed"></a> `onExceed?` | `readonly` | `"warn"` \| `"throw"` | What to do on breach. Default `'throw'`. | packages/provider/src/middleware/with-cost-limit.ts:30 |
| <a id="property-resolveobservedcost"></a> `resolveObservedCost?` | `readonly` | (`scope`, `metadata`) => `number` | Resolver returning the current observed cost for the relevant scope. The resolver lets consumers wire any accumulator (the shipped `@graphorin/observability/cost.CostTracker` works out of the box). When unset, the middleware is a no-op (a placeholder for tooling that wires the accumulator later). | packages/provider/src/middleware/with-cost-limit.ts:38 |
