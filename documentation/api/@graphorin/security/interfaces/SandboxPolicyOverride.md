[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SandboxPolicyOverride

# Interface: SandboxPolicyOverride

Defined in: packages/security/src/sandbox/tier-resolver.ts:47

**`Stable`**

Operator-supplied policy override. Mirrors `Tool.sandboxPolicy` from
`@graphorin/core`, plus optional override fields the operator can
tune per tool.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind?` | `readonly` | [`SandboxKind`](/api/@graphorin/security/type-aliases/SandboxKind.md) | packages/security/src/sandbox/tier-resolver.ts:48 |
| <a id="property-maxmemorymb"></a> `maxMemoryMb?` | `readonly` | `number` | packages/security/src/sandbox/tier-resolver.ts:52 |
| <a id="property-nofilesystem"></a> `noFilesystem?` | `readonly` | `boolean` | packages/security/src/sandbox/tier-resolver.ts:50 |
| <a id="property-nonetwork"></a> `noNetwork?` | `readonly` | `boolean` | packages/security/src/sandbox/tier-resolver.ts:49 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | packages/security/src/sandbox/tier-resolver.ts:51 |
