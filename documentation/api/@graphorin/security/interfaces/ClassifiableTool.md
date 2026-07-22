[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ClassifiableTool

# Interface: ClassifiableTool

Defined in: packages/security/src/guard/classifier.ts:26

**`Stable`**

Subset of the `Tool` shape the classifier needs. Decoupled from
`@graphorin/core`'s `Tool` type so the classifier can also work on
the lighter shapes the skills loader produces.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-memoryguardtier"></a> `memoryGuardTier?` | `readonly` | [`MemoryGuardTier`](/api/@graphorin/security/type-aliases/MemoryGuardTier.md) | Operator opt-in tier override. | packages/security/src/guard/classifier.ts:32 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | - | packages/security/src/guard/classifier.ts:27 |
| <a id="property-secretsallowed"></a> `secretsAllowed?` | `readonly` | readonly `string`[] | Per-tool ACL declared by `tool({ secretsAllowed })`. | packages/security/src/guard/classifier.ts:30 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | packages/security/src/guard/classifier.ts:28 |
| <a id="property-trustlevel"></a> `trustLevel?` | `readonly` | `"untrusted"` \| `"built-in"` \| `"user-defined"` \| `"trusted"` | Source trust level - `'untrusted'` forces the strict tier. | packages/security/src/guard/classifier.ts:34 |
