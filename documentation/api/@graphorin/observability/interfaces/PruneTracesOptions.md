[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / PruneTracesOptions

# Interface: PruneTracesOptions

Defined in: packages/observability/src/replay/log.ts:39

**`Stable`**

Configuration shape for [pruneTraces](/api/@graphorin/observability/functions/pruneTraces.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | **`Internal`** Wall clock used to compute the threshold. Defaults to `Date.now`. | packages/observability/src/replay/log.ts:49 |
| <a id="property-olderthandays"></a> `olderThanDays` | `readonly` | `number` | Files older than `olderThanDays` are deleted. `0` keeps every file. | packages/observability/src/replay/log.ts:43 |
| <a id="property-root"></a> `root` | `readonly` | `string` | Root directory housing the JSONL files. | packages/observability/src/replay/log.ts:41 |
