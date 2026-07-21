[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ExpandHopsStoreOptions

# Interface: ExpandHopsStoreOptions

Defined in: packages/memory/src/internal/storage-adapter.ts:843

Options for [GraphMemoryStoreExt.expandOneHop](/api/@graphorin/memory/interfaces/GraphMemoryStoreExt.md#expandonehop).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-asof"></a> `asOf?` | `readonly` | `string` | Point-in-time filter, ISO-8601 (same semantics as fact search). | packages/memory/src/internal/storage-adapter.ts:851 |
| <a id="property-includequarantined"></a> `includeQuarantined?` | `readonly` | `boolean` | Include quarantined neighbours (validation / inspector path). | packages/memory/src/internal/storage-adapter.ts:849 |
| <a id="property-includesuperseded"></a> `includeSuperseded?` | `readonly` | `boolean` | Include superseded / validity-expired neighbours. Default reads evaluate validity at NOW. | packages/memory/src/internal/storage-adapter.ts:856 |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` | Max neighbours to return (default `60`). | packages/memory/src/internal/storage-adapter.ts:847 |
| <a id="property-maxhops"></a> `maxHops?` | `readonly` | `number` | Traversal depth (default `1`). | packages/memory/src/internal/storage-adapter.ts:845 |
