[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SandboxPolicyOverride

# Interface: SandboxPolicyOverride

Defined in: [packages/security/src/sandbox/tier-resolver.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/tier-resolver.ts#L47)

Operator-supplied policy override. Mirrors `Tool.sandboxPolicy` from
`@graphorin/core`, plus optional override fields the operator can
tune per tool.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind?` | `readonly` | [`SandboxKind`](/api/@graphorin/security/type-aliases/SandboxKind.md) | [packages/security/src/sandbox/tier-resolver.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/tier-resolver.ts#L48) |
| <a id="property-maxmemorymb"></a> `maxMemoryMb?` | `readonly` | `number` | [packages/security/src/sandbox/tier-resolver.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/tier-resolver.ts#L52) |
| <a id="property-nofilesystem"></a> `noFilesystem?` | `readonly` | `boolean` | [packages/security/src/sandbox/tier-resolver.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/tier-resolver.ts#L50) |
| <a id="property-nonetwork"></a> `noNetwork?` | `readonly` | `boolean` | [packages/security/src/sandbox/tier-resolver.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/tier-resolver.ts#L49) |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | [packages/security/src/sandbox/tier-resolver.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/tier-resolver.ts#L51) |
