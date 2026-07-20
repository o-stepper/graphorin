[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / PromotionPolicyConfig

# Interface: PromotionPolicyConfig

Defined in: packages/memory/src/consolidator/promotion.ts:35

**`Stable`**

Threshold configuration - `createMemory({ consolidator: {
promotion } })`. Every configured threshold must pass (AND).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowedprovenance"></a> `allowedProvenance?` | `readonly` | readonly [`MemoryProvenance`](/api/@graphorin/core/type-aliases/MemoryProvenance.md)[] | Provenances eligible for promotion. Default: `['extraction', 'reflection', 'induction']` - synthesized content only; `'tool'` / `'imported'` provenance never auto-promotes unless listed explicitly. | packages/memory/src/consolidator/promotion.ts:50 |
| <a id="property-maxperrun"></a> `maxPerRun?` | `readonly` | `number` | Upper bound on promotions per deep pass. Default `10`. | packages/memory/src/consolidator/promotion.ts:52 |
| <a id="property-minagems"></a> `minAgeMs?` | `readonly` | `number` | Minimum age since the fact was written, in ms. Default 24h. | packages/memory/src/consolidator/promotion.ts:43 |
| <a id="property-minrecalls"></a> `minRecalls?` | `readonly` | `number` | Minimum total recalls (migration-027 counter). Default `3`. | packages/memory/src/consolidator/promotion.ts:39 |
| <a id="property-minsalience"></a> `minSalience?` | `readonly` | `number` | Minimum `importance` (salience hint) in `[0, 1]`. Default `0` (off). | packages/memory/src/consolidator/promotion.ts:37 |
| <a id="property-minuniquequeries"></a> `minUniqueQueries?` | `readonly` | `number` | Minimum DISTINCT recall queries (migration-036 ledger). Default `2`. | packages/memory/src/consolidator/promotion.ts:41 |
