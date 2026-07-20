[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / MemoryModificationGuard

# Interface: MemoryModificationGuard

Defined in: packages/security/src/guard/types.ts:86

**`Stable`**

Per-tool guard interface. Each tier returns its own implementation
via the `createGuard(...)` factory.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-snapshot"></a> `snapshot` | `readonly` | (`reader`) => `Promise`\&lt;[`MemorySnapshot`](/api/@graphorin/security/interfaces/MemorySnapshot.md)\&gt; | Snapshot the relevant regions before tool execution. | packages/security/src/guard/types.ts:89 |
| <a id="property-tier"></a> `tier` | `readonly` | [`MemoryGuardTier`](/api/@graphorin/security/type-aliases/MemoryGuardTier.md) | - | packages/security/src/guard/types.ts:87 |
| <a id="property-verify"></a> `verify` | `readonly` | (`pre`, `reader`) => `Promise`\&lt;[`GuardVerifyResult`](/api/@graphorin/security/type-aliases/GuardVerifyResult.md)\&gt; | Verify that the post-execution state matches the pre-execution snapshot. | packages/security/src/guard/types.ts:91 |
