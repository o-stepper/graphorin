[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / GuardStatusEntry

# Interface: GuardStatusEntry

Defined in: packages/cli/src/commands/guard.ts:46

**`Stable`**

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | packages/cli/src/commands/guard.ts:49 |
| <a id="property-tier"></a> `tier` | `readonly` | [`MemoryGuardTier`](/api/@graphorin/security/type-aliases/MemoryGuardTier.md) | packages/cli/src/commands/guard.ts:47 |
| <a id="property-variant"></a> `variant` | `readonly` | \| `"NO_GUARD"` \| `"API_BOUNDARY_GUARD"` \| `"AUDIT_ONLY_GUARD"` \| `"STRICT_FULL_GUARD"` | packages/cli/src/commands/guard.ts:48 |
