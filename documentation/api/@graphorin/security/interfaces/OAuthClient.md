[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthClient

# Interface: OAuthClient

Defined in: [packages/security/src/oauth/types.ts:248](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L248)

Public surface of the [createOAuthClient](/api/@graphorin/security/functions/createOAuthClient.md) factory. Each method
accepts an `AbortSignal` so callers can cancel mid-flow.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-metadata"></a> `metadata` | `readonly` | \| [`DiscoveredMetadata`](/api/@graphorin/security/interfaces/DiscoveredMetadata.md) \| `undefined` | Cached metadata; the field reflects the latest known state. | [packages/security/src/oauth/types.ts:254](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L254) |
| <a id="property-registration"></a> `registration` | `readonly` | \| [`OAuthRegistration`](/api/@graphorin/security/interfaces/OAuthRegistration.md) \| `undefined` | Cached registration; the field reflects the latest known state. | [packages/security/src/oauth/types.ts:252](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L252) |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | - | [packages/security/src/oauth/types.ts:249](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L249) |
| <a id="property-serverurl"></a> `serverUrl` | `readonly` | `string` | - | [packages/security/src/oauth/types.ts:250](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L250) |

## Methods

### authorizeCode()

```ts
authorizeCode(opts?): Promise<OAuthSession>;
```

Defined in: [packages/security/src/oauth/types.ts:271](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L271)

Run the Authorization Code + PKCE flow.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | [`AuthorizeCodeOptions`](/api/@graphorin/security/interfaces/AuthorizeCodeOptions.md) |

#### Returns

`Promise`\&lt;[`OAuthSession`](/api/@graphorin/security/interfaces/OAuthSession.md)\&gt;

***

### authorizeDevice()

```ts
authorizeDevice(opts?): Promise<OAuthSession>;
```

Defined in: [packages/security/src/oauth/types.ts:273](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L273)

Run the Device Authorization Grant.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | [`AuthorizeDeviceOptions`](/api/@graphorin/security/interfaces/AuthorizeDeviceOptions.md) |

#### Returns

`Promise`\&lt;[`OAuthSession`](/api/@graphorin/security/interfaces/OAuthSession.md)\&gt;

***

### discover()

```ts
discover(opts?): Promise<DiscoveredMetadata>;
```

Defined in: [packages/security/src/oauth/types.ts:257](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L257)

Run discovery. Returns the cached value when available.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | \{ `force?`: `boolean`; `signal?`: `AbortSignal`; \} |
| `opts.force?` | `boolean` |
| `opts.signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;[`DiscoveredMetadata`](/api/@graphorin/security/interfaces/DiscoveredMetadata.md)\&gt;

***

### refresh()

```ts
refresh(opts?): Promise<OAuthSession>;
```

Defined in: [packages/security/src/oauth/types.ts:280](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L280)

Refresh the access token. Reuses the in-flight refresh promise
when one is already running, so concurrent callers all observe
the same network round-trip.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | \{ `force?`: `boolean`; `signal?`: `AbortSignal`; \} |
| `opts.force?` | `boolean` |
| `opts.signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;[`OAuthSession`](/api/@graphorin/security/interfaces/OAuthSession.md)\&gt;

***

### registerClient()

```ts
registerClient(opts?): Promise<DynamicClientRegistrationResult>;
```

Defined in: [packages/security/src/oauth/types.ts:263](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L263)

Run Dynamic Client Registration. The metadata's
`registration_endpoint` must be set; the call rejects with
`OAuthRegistrationUnsupportedError` otherwise.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | \{ `clientName?`: `string`; `redirectUris?`: readonly `string`[]; `scope?`: `string`; `signal?`: `AbortSignal`; \} |
| `opts.clientName?` | `string` |
| `opts.redirectUris?` | readonly `string`[] |
| `opts.scope?` | `string` |
| `opts.signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;[`DynamicClientRegistrationResult`](/api/@graphorin/security/interfaces/DynamicClientRegistrationResult.md)\&gt;

***

### revoke()

```ts
revoke(opts?): Promise<void>;
```

Defined in: [packages/security/src/oauth/types.ts:282](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L282)

Revoke the current session against the discovered revocation endpoint.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | \{ `reason?`: `string`; `signal?`: `AbortSignal`; \} |
| `opts.reason?` | `string` |
| `opts.signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### status()

```ts
status(): Promise<
  | OAuthSessionMetadata
| null>;
```

Defined in: [packages/security/src/oauth/types.ts:284](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/types.ts#L284)

Audit-safe metadata view. Returns `null` when no session is stored.

#### Returns

`Promise`\<
  \| [`OAuthSessionMetadata`](/api/@graphorin/security/interfaces/OAuthSessionMetadata.md)
  \| `null`\>
