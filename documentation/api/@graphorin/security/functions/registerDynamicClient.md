[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / registerDynamicClient

# Function: registerDynamicClient()

```ts
function registerDynamicClient(metadata, options): Promise<DynamicClientRegistrationResult>;
```

Defined in: [packages/security/src/oauth/dynamic-client-registration.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/dynamic-client-registration.ts#L88)

Register a fresh OAuth client with the discovered authorization
server using RFC 7591.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `metadata` | [`DiscoveredMetadata`](/api/@graphorin/security/interfaces/DiscoveredMetadata.md) |
| `options` | [`RegisterDynamicClientOptions`](/api/@graphorin/security/interfaces/RegisterDynamicClientOptions.md) |

## Returns

`Promise`\&lt;[`DynamicClientRegistrationResult`](/api/@graphorin/security/interfaces/DynamicClientRegistrationResult.md)\&gt;

## Stable
