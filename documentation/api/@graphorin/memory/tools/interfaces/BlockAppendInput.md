[**Graphorin API reference v0.15.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [tools](/api/@graphorin/memory/tools/index.md) / BlockAppendInput

# Interface: BlockAppendInput

Defined in: packages/memory/src/tools/block-tools.ts:21

Explicit interfaces instead of `z.infer<typeof schema>` - the
inferred aliases baked concrete v3 zod object generics into
the published d.ts, which do not typecheck under a zod@4 consumer.
Interface&lt;-&gt;schema equality is pinned by type tests.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `string` | packages/memory/src/tools/block-tools.ts:23 |
| <a id="property-label"></a> `label` | `string` | packages/memory/src/tools/block-tools.ts:22 |
