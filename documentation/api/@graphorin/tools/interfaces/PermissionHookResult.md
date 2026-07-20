[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / PermissionHookResult

# Interface: PermissionHookResult

Defined in: packages/tools/src/executor/types.ts:397

**`Stable`**

Verdict returned by a [PermissionHook](/api/@graphorin/tools/type-aliases/PermissionHook.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-decision"></a> `decision` | `readonly` | `"allow"` \| `"deny"` \| `"ask"` \| `"defer"` | - | packages/tools/src/executor/types.ts:398 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | Human-readable reason surfaced on non-allow decisions and audits. | packages/tools/src/executor/types.ts:412 |
| <a id="property-updatedinput"></a> `updatedInput?` | `readonly` | `unknown` | Optional raw-shaped replacement args (a sandbox-redirect rewrite). Re-validated against the tool's input schema; on success it replaces BOTH the validated input and the effective args before the approval phase, so the approval gate, the argument policy and the data-flow sink gate all see what will actually run. A rewrite that fails re-validation fails the call as `invalid_input`. On a pre-approved resume replay the hook must not rewrite the granted args: a differing `updatedInput` fails the call instead of executing a payload nobody saw. | packages/tools/src/executor/types.ts:410 |
