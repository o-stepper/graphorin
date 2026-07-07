[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / VerifyContext

# Interface: VerifyContext

Defined in: [packages/security/src/auth/verify.ts:127](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/verify.ts#L127)

Optional context surfaced to the verify pipeline.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-ip"></a> `ip?` | `readonly` | `string` | Caller IP address (or pseudonymous hash). Used by the per-IP rate limit. | [packages/security/src/auth/verify.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/verify.ts#L129) |
