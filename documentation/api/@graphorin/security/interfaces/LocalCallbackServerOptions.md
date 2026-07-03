[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / LocalCallbackServerOptions

# Interface: LocalCallbackServerOptions

Defined in: packages/security/src/oauth/callback-server.ts:56

Options accepted by [startLocalCallbackServer](/api/@graphorin/security/functions/startLocalCallbackServer.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-errorhtml"></a> `errorHtml?` | `readonly` | `string` | Browser-facing error page (HTML). Optional. | packages/security/src/oauth/callback-server.ts:66 |
| <a id="property-maxattempts"></a> `maxAttempts?` | `readonly` | `number` | Maximum number of bind attempts before failing. Defaults to 5. | packages/security/src/oauth/callback-server.ts:60 |
| <a id="property-path"></a> `path?` | `readonly` | `string` | Optional override for the callback path. Defaults to `/callback`. | packages/security/src/oauth/callback-server.ts:62 |
| <a id="property-portrange"></a> `portRange?` | `readonly` | readonly \[`number`, `number`\] | Inclusive port range. Defaults to `[49152, 65535]`. | packages/security/src/oauth/callback-server.ts:58 |
| <a id="property-successhtml"></a> `successHtml?` | `readonly` | `string` | Browser-facing success page (HTML). Optional. | packages/security/src/oauth/callback-server.ts:64 |
