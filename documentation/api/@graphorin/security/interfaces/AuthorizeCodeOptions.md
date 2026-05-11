[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuthorizeCodeOptions

# Interface: AuthorizeCodeOptions

Defined in: packages/security/src/oauth/types.ts:171

Options accepted by `OAuthClient.authorizeCode(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-callbacktimeoutms"></a> `callbackTimeoutMs?` | `readonly` | `number` | Maximum time spent waiting for the callback. Defaults to 5 min. | packages/security/src/oauth/types.ts:191 |
| <a id="property-openauthorizationurl"></a> `openAuthorizationUrl?` | `readonly` | (`url`, `signal?`) => `void` \| `Promise`\&lt;`void`\&gt; | Function to render the authorization URL to the user. Defaults to `openInBrowser(url)` plus a console fallback. Consumers can plug in their own UI. | packages/security/src/oauth/types.ts:184 |
| <a id="property-portrange"></a> `portRange?` | `readonly` | readonly \[`number`, `number`\] | Override the localhost port range. Inclusive on both ends. Defaults to `[49152, 65535]`. | packages/security/src/oauth/types.ts:189 |
| <a id="property-redirecturi"></a> `redirectUri?` | `readonly` | `string` | Pre-existing redirect URI. When omitted the client will spin up a localhost callback server on a random port in `49152-65535` and use `http://127.0.0.1:<port>/callback`. | packages/security/src/oauth/types.ts:178 |
| <a id="property-scope"></a> `scope?` | `readonly` | `string` | - | packages/security/src/oauth/types.ts:172 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation. Aborts the callback server, browser open, and exchange. | packages/security/src/oauth/types.ts:193 |
