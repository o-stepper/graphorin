[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ToolBudgetEntry

# Interface: ToolBudgetEntry

Defined in: packages/memory/src/context-engine/tool-budget/types.ts:17

Minimal `Tool` shape the allocator consumes. Mirrors the
`@graphorin/core` `Tool` interface but narrowed to the fields
the budget logic actually inspects (name + description). A
structural shape lets callers wire either `Tool` directly or
a `RegistryEntry` produced by `@graphorin/tools`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | packages/memory/src/context-engine/tool-budget/types.ts:19 |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/memory/src/context-engine/tool-budget/types.ts:18 |
