[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SecretResolverContext

# Interface: SecretResolverContext

Defined in: packages/core/src/contracts/secrets-store.ts:25

**`Stable`**

Optional context handed to a resolver. Carries the originating tool /
agent identifiers so the audit log can attribute the resolution.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | packages/core/src/contracts/secrets-store.ts:27 |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | packages/core/src/contracts/secrets-store.ts:28 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/core/src/contracts/secrets-store.ts:29 |
| <a id="property-toolname"></a> `toolName?` | `readonly` | `string` | packages/core/src/contracts/secrets-store.ts:26 |
