[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / CostTrackerOptions

# Interface: CostTrackerOptions

Defined in: [packages/observability/src/cost/types.ts:124](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L124)

Configuration shape for [createCostTracker](/api/@graphorin/observability/functions/createCostTracker.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-budgets"></a> `budgets?` | `readonly` | [`CostBudgets`](/api/@graphorin/observability/interfaces/CostBudgets.md) | - | [packages/observability/src/cost/types.ts:125](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L125) |
| <a id="property-oneviction"></a> `onEviction?` | `readonly` | (`event`) => `void` | W-092: observer for retention evictions (dashboards / warnings). | [packages/observability/src/cost/types.ts:147](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L147) |
| <a id="property-onexceed"></a> `onExceed?` | `readonly` | [`CostBudgetExceededCallback`](/api/@graphorin/observability/type-aliases/CostBudgetExceededCallback.md) | - | [packages/observability/src/cost/types.ts:126](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L126) |
| <a id="property-retention"></a> `retention?` | `readonly` | \| `false` \| \{ `maxScopeEntries?`: `number`; `maxSpanEntries?`: `number`; \} | W-092: memory bound for the tracker's internal maps. The tracker aggregates for the LIFETIME of the process - exactly the long-running-assistant scenario - so unbounded per-span / per-scope maps are a leak. When an insertion pushes a map past its limit the OLDEST entries (insertion order, not LRU) are evicted and `onEviction` fires per dropped id; `usage()` / `usageForSpan()` for an evicted id then report zero figures, and a late rollup to an evicted ancestor re-creates it from zero. Defaults to `{ maxSpanEntries: 10_000, maxScopeEntries: 10_000 }`; pass `false` to restore the previous unbounded behaviour. | [packages/observability/src/cost/types.ts:139](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/cost/types.ts#L139) |
