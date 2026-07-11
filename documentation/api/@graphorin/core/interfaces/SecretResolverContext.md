[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SecretResolverContext

# Interface: SecretResolverContext

Defined in: [packages/core/src/contracts/secrets-store.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L25)

Optional context handed to a resolver. Carries the originating tool /
agent identifiers so the audit log can attribute the resolution.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | [packages/core/src/contracts/secrets-store.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L27) |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | [packages/core/src/contracts/secrets-store.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L28) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | [packages/core/src/contracts/secrets-store.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L29) |
| <a id="property-toolname"></a> `toolName?` | `readonly` | `string` | [packages/core/src/contracts/secrets-store.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/secrets-store.ts#L26) |
