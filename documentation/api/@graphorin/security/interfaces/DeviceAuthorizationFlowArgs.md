[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DeviceAuthorizationFlowArgs

# Interface: DeviceAuthorizationFlowArgs

Defined in: [packages/security/src/oauth/authorize-device-flow.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L48)

Internal arguments fed into [runDeviceAuthorizationFlow](/api/@graphorin/security/functions/runDeviceAuthorizationFlow.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-metadata"></a> `metadata` | `readonly` | [`DiscoveredMetadata`](/api/@graphorin/security/interfaces/DiscoveredMetadata.md) | - | [packages/security/src/oauth/authorize-device-flow.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L50) |
| <a id="property-options"></a> `options` | `readonly` | [`AuthorizeDeviceOptions`](/api/@graphorin/security/interfaces/AuthorizeDeviceOptions.md) | - | [packages/security/src/oauth/authorize-device-flow.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L52) |
| <a id="property-registration"></a> `registration` | `readonly` | [`OAuthRegistration`](/api/@graphorin/security/interfaces/OAuthRegistration.md) | - | [packages/security/src/oauth/authorize-device-flow.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L51) |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | - | [packages/security/src/oauth/authorize-device-flow.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L49) |
| <a id="property-sleep"></a> `sleep?` | `readonly` | (`ms`, `signal?`) => `Promise`\&lt;`void`\&gt; | Sleep helper. Defaults to `setTimeout`. Tests use this to fast- forward the polling cadence. | [packages/security/src/oauth/authorize-device-flow.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L57) |
