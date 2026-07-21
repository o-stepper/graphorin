[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / startLocalCallbackServer

# Function: startLocalCallbackServer()

```ts
function startLocalCallbackServer(options?): Promise<LocalCallbackServer>;
```

Defined in: packages/security/src/oauth/callback-server.ts:85

**`Stable`**

Bind a localhost callback server on a random port in
`options.portRange`. The handle exposes the chosen redirect URI
and a `waitForCallback(signal)` helper that resolves once the
browser hits the path.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LocalCallbackServerOptions`](/api/@graphorin/security/interfaces/LocalCallbackServerOptions.md) |

## Returns

`Promise`\&lt;[`LocalCallbackServer`](/api/@graphorin/security/interfaces/LocalCallbackServer.md)\&gt;
