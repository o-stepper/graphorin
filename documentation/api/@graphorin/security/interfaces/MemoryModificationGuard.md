[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / MemoryModificationGuard

# Interface: MemoryModificationGuard

Defined in: [packages/security/src/guard/types.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/types.ts#L85)

Per-tool guard interface. Each tier returns its own implementation
via the `createGuard(...)` factory.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-snapshot"></a> `snapshot` | `readonly` | (`reader`) => `Promise`\&lt;[`MemorySnapshot`](/api/@graphorin/security/interfaces/MemorySnapshot.md)\&gt; | Snapshot the relevant regions before tool execution. | [packages/security/src/guard/types.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/types.ts#L88) |
| <a id="property-tier"></a> `tier` | `readonly` | [`MemoryGuardTier`](/api/@graphorin/security/type-aliases/MemoryGuardTier.md) | - | [packages/security/src/guard/types.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/types.ts#L86) |
| <a id="property-verify"></a> `verify` | `readonly` | (`pre`, `reader`) => `Promise`\&lt;[`GuardVerifyResult`](/api/@graphorin/security/type-aliases/GuardVerifyResult.md)\&gt; | Verify that the post-execution state matches the pre-execution snapshot. | [packages/security/src/guard/types.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/types.ts#L90) |
