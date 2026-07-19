[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DeviceAuthorizationFlowArgs

# Interface: DeviceAuthorizationFlowArgs

Defined in: packages/security/src/oauth/authorize-device-flow.ts:48

Internal arguments fed into [runDeviceAuthorizationFlow](/api/@graphorin/security/functions/runDeviceAuthorizationFlow.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-metadata"></a> `metadata` | `readonly` | [`DiscoveredMetadata`](/api/@graphorin/security/interfaces/DiscoveredMetadata.md) | - | packages/security/src/oauth/authorize-device-flow.ts:50 |
| <a id="property-options"></a> `options` | `readonly` | [`AuthorizeDeviceOptions`](/api/@graphorin/security/interfaces/AuthorizeDeviceOptions.md) | - | packages/security/src/oauth/authorize-device-flow.ts:52 |
| <a id="property-registration"></a> `registration` | `readonly` | [`OAuthRegistration`](/api/@graphorin/security/interfaces/OAuthRegistration.md) | - | packages/security/src/oauth/authorize-device-flow.ts:51 |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | - | packages/security/src/oauth/authorize-device-flow.ts:49 |
| <a id="property-sleep"></a> `sleep?` | `readonly` | (`ms`, `signal?`) => `Promise`\&lt;`void`\&gt; | Sleep helper. Defaults to `setTimeout`. Tests use this to fast- forward the polling cadence. | packages/security/src/oauth/authorize-device-flow.ts:57 |
