[**Graphorin API reference v0.13.12**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [tools](/api/@graphorin/memory/tools/index.md) / FactRememberInput

# Interface: FactRememberInput

Defined in: packages/memory/src/tools/fact-tools.ts:45

Explicit interfaces instead of `z.infer<typeof schema>` - the
inferred aliases baked concrete v3 zod object generics into
the published d.ts, which do not typecheck under a zod@4 consumer.
Interface&lt;-&gt;schema equality is pinned by type tests. Optionals carry
`| undefined` to match zod's `.optional()` inference exactly.

## Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-confidence"></a> `confidence?` | `number` | packages/memory/src/tools/fact-tools.ts:48 |
| <a id="property-sensitivity"></a> `sensitivity?` | `"public"` \| `"internal"` \| `"secret"` | packages/memory/src/tools/fact-tools.ts:49 |
| <a id="property-tags"></a> `tags?` | `string`[] | packages/memory/src/tools/fact-tools.ts:47 |
| <a id="property-text"></a> `text` | `string` | packages/memory/src/tools/fact-tools.ts:46 |
| <a id="property-validfrom"></a> `validFrom?` | `string` | packages/memory/src/tools/fact-tools.ts:50 |
| <a id="property-validto"></a> `validTo?` | `string` | packages/memory/src/tools/fact-tools.ts:51 |
