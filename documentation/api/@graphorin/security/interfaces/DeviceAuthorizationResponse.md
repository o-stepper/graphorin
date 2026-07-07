[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DeviceAuthorizationResponse

# Interface: DeviceAuthorizationResponse

Defined in: [packages/security/src/oauth/authorize-device-flow.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L20)

Device-authorization request response (RFC 8628 § 3.2).

## Indexable

```ts
[extra: string]: unknown
```

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-device_code"></a> `device_code` | `readonly` | `string` | [packages/security/src/oauth/authorize-device-flow.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L21) |
| <a id="property-expires_in"></a> `expires_in` | `readonly` | `number` | [packages/security/src/oauth/authorize-device-flow.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L25) |
| <a id="property-interval"></a> `interval?` | `readonly` | `number` | [packages/security/src/oauth/authorize-device-flow.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L26) |
| <a id="property-user_code"></a> `user_code` | `readonly` | `string` | [packages/security/src/oauth/authorize-device-flow.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L22) |
| <a id="property-verification_uri"></a> `verification_uri` | `readonly` | `string` | [packages/security/src/oauth/authorize-device-flow.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L23) |
| <a id="property-verification_uri_complete"></a> `verification_uri_complete?` | `readonly` | `string` | [packages/security/src/oauth/authorize-device-flow.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L24) |
