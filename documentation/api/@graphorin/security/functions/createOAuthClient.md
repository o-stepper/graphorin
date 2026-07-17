[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / createOAuthClient

# Function: createOAuthClient()

```ts
function createOAuthClient(options): OAuthClient;
```

Defined in: [packages/security/src/oauth/client.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/client.ts#L41)

Create an [OAuthClient](/api/@graphorin/security/interfaces/OAuthClient.md). The factory does not perform any
network I/O until one of the methods on the returned client is
called.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateOAuthClientOptions`](/api/@graphorin/security/interfaces/CreateOAuthClientOptions.md) |

## Returns

[`OAuthClient`](/api/@graphorin/security/interfaces/OAuthClient.md)

## Stable
