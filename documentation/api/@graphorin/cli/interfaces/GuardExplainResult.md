[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / GuardExplainResult

# Interface: GuardExplainResult

Defined in: [packages/cli/src/commands/guard.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/guard.ts#L81)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-reason"></a> `reason` | `readonly` | `string` | [packages/cli/src/commands/guard.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/guard.ts#L85) |
| <a id="property-tier"></a> `tier` | `readonly` | [`MemoryGuardTier`](/api/@graphorin/security/type-aliases/MemoryGuardTier.md) | [packages/cli/src/commands/guard.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/guard.ts#L83) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | [packages/cli/src/commands/guard.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/guard.ts#L82) |
| <a id="property-variant"></a> `variant` | `readonly` | \| `"NO_GUARD"` \| `"API_BOUNDARY_GUARD"` \| `"AUDIT_ONLY_GUARD"` \| `"STRICT_FULL_GUARD"` | [packages/cli/src/commands/guard.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/guard.ts#L84) |
