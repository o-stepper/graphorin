[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / runDeviceAuthorizationFlow

# Function: runDeviceAuthorizationFlow()

```ts
function runDeviceAuthorizationFlow(args): Promise<OAuthSession>;
```

Defined in: [packages/security/src/oauth/authorize-device-flow.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L65)

Drive the Device Authorization Grant flow.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | [`DeviceAuthorizationFlowArgs`](/api/@graphorin/security/interfaces/DeviceAuthorizationFlowArgs.md) |

## Returns

`Promise`\&lt;[`OAuthSession`](/api/@graphorin/security/interfaces/OAuthSession.md)\&gt;

## Stable
