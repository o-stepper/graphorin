[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthStatusSnapshot

# Interface: OAuthStatusSnapshot

Defined in: [packages/security/src/oauth/library.ts:237](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L237)

Snapshot of the OAuth subsystem state. Used by `graphorin auth status`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-defaultstrategy"></a> `defaultStrategy` | `readonly` | \| [`OAuthStrategy`](/api/@graphorin/security/interfaces/OAuthStrategy.md) \| `null` | [packages/security/src/oauth/library.ts:240](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L240) |
| <a id="property-providers"></a> `providers` | `readonly` | readonly \{ `hasMatch`: `boolean`; `id`: `string`; \}[] | [packages/security/src/oauth/library.ts:239](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L239) |
| <a id="property-sessions"></a> `sessions` | `readonly` | readonly [`OAuthSessionMetadata`](/api/@graphorin/security/interfaces/OAuthSessionMetadata.md)[] | [packages/security/src/oauth/library.ts:238](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/library.ts#L238) |
