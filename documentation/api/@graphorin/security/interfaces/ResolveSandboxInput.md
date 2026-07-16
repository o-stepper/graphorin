[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ResolveSandboxInput

# Interface: ResolveSandboxInput

Defined in: [packages/security/src/sandbox/tier-resolver.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/tier-resolver.ts#L63)

Input to `resolveSandbox(...)`. The fields are intentionally
decoupled from `Tool` / `Skill` types so the resolver can be reused
by the agent runtime, the skills loader, and the MCP client without
a circular dependency.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-override"></a> `override?` | `readonly` | [`SandboxPolicyOverride`](/api/@graphorin/security/interfaces/SandboxPolicyOverride.md) | [packages/security/src/sandbox/tier-resolver.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/tier-resolver.ts#L67) |
| <a id="property-skillname"></a> `skillName?` | `readonly` | `string` | [packages/security/src/sandbox/tier-resolver.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/tier-resolver.ts#L66) |
| <a id="property-toolname"></a> `toolName?` | `readonly` | `string` | [packages/security/src/sandbox/tier-resolver.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/tier-resolver.ts#L65) |
| <a id="property-trustlevel"></a> `trustLevel` | `readonly` | [`SandboxTrustLevel`](/api/@graphorin/security/type-aliases/SandboxTrustLevel.md) | [packages/security/src/sandbox/tier-resolver.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/tier-resolver.ts#L64) |
