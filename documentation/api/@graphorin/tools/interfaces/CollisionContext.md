[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / CollisionContext

# Interface: CollisionContext

Defined in: packages/tools/src/registry/types.ts:32

**`Stable`**

Context passed alongside the strategy. Mirrors the shape used by
the per-source dispatchers (the MCP client in Phase 09 and the
skill loader in Phase 08).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-priority"></a> `priority?` | `readonly` | `number` | packages/tools/src/registry/types.ts:34 |
| <a id="property-source"></a> `source` | `readonly` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) | packages/tools/src/registry/types.ts:33 |
