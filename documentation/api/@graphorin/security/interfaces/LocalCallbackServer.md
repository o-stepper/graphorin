[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / LocalCallbackServer

# Interface: LocalCallbackServer

Defined in: [packages/security/src/oauth/callback-server.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/callback-server.ts#L70)

Handle returned by [startLocalCallbackServer](/api/@graphorin/security/functions/startLocalCallbackServer.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-close"></a> `close` | `readonly` | () => `Promise`\&lt;`void`\&gt; | [packages/security/src/oauth/callback-server.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/callback-server.ts#L74) |
| <a id="property-port"></a> `port` | `readonly` | `number` | [packages/security/src/oauth/callback-server.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/callback-server.ts#L72) |
| <a id="property-redirecturi"></a> `redirectUri` | `readonly` | `string` | [packages/security/src/oauth/callback-server.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/callback-server.ts#L71) |
| <a id="property-waitforcallback"></a> `waitForCallback` | `readonly` | (`signal?`) => `Promise`\&lt;[`CallbackParams`](/api/@graphorin/security/interfaces/CallbackParams.md)\&gt; | [packages/security/src/oauth/callback-server.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/callback-server.ts#L73) |
