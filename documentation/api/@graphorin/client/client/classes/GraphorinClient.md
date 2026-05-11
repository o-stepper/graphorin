[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [client](/api/@graphorin/client/client/index.md) / GraphorinClient

# Class: GraphorinClient

Defined in: packages/client/src/graphorin-client.ts:170

## Stable

## Constructors

### Constructor

```ts
new GraphorinClient(options): GraphorinClient;
```

Defined in: packages/client/src/graphorin-client.ts:180

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`GraphorinClientOptions`](/api/@graphorin/client/client/interfaces/GraphorinClientOptions.md) |

#### Returns

`GraphorinClient`

## Accessors

### transportKind

#### Get Signature

```ts
get transportKind(): 
  | TransportKind
  | undefined;
```

Defined in: packages/client/src/graphorin-client.ts:399

Return the active transport kind (or `undefined` if not connected).

##### Returns

  \| [`TransportKind`](/api/@graphorin/client/type-aliases/TransportKind.md)
  \| `undefined`

## Methods

### cancel()

```ts
cancel(runId, opts?): Promise<unknown>;
```

Defined in: packages/client/src/graphorin-client.ts:278

Cancel a server-side run. Sends the `run.cancel` RPC and
resolves with the server's `result` payload (typically
`{ cancelled: true, partialStateAvailable: true }`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `opts` | \{ `drain?`: `boolean`; `onPendingApprovals?`: `"deny"` \| `"preserve"`; `reason?`: `string`; \} |
| `opts.drain?` | `boolean` |
| `opts.onPendingApprovals?` | `"deny"` \| `"preserve"` |
| `opts.reason?` | `string` |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### cancelNotify()

```ts
cancelNotify(requestId): void;
```

Defined in: packages/client/src/graphorin-client.ts:357

Send an MCP-compatible cancellation notification. Does not wait
for a server reply (notifications have no `id`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `requestId` | `string` |

#### Returns

`void`

***

### connect()

```ts
connect(): Promise<void>;
```

Defined in: packages/client/src/graphorin-client.ts:195

Open the underlying transport. Resolves once the server has
accepted the handshake (`'open'`); rejects with a typed
[GraphorinClientError](/api/@graphorin/client/errors/classes/GraphorinClientError.md) otherwise.

Calling `connect()` while already connected is a no-op; calling
it during another `connect()` returns the same promise.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### disconnect()

```ts
disconnect(): Promise<void>;
```

Defined in: packages/client/src/graphorin-client.ts:375

Disconnect the underlying transport and abort every pending RPC
+ subscription. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### ping()

```ts
ping(): Promise<void>;
```

Defined in: packages/client/src/graphorin-client.ts:229

Send a `ping` RPC and resolve when the server replies with `pong`.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### resume()

```ts
resume(
   runId, 
   directive?, 
opts?): Promise<unknown>;
```

Defined in: packages/client/src/graphorin-client.ts:311

Resume a paused (HITL) run. The WebSocket protocol intentionally
does NOT carry a `resume` control message — resumes are durable
+ idempotent + body-carrying, which maps cleanly onto the REST
endpoint `POST /v1/runs/:runId/resume` (Phase 14a). The client
forwards the call via the supplied `fetch` implementation so
subscribers continue to receive events on the same WS connection.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `directive?` | `unknown` |
| `opts?` | \{ `idempotencyKey?`: `string`; \} |
| `opts.idempotencyKey?` | `string` |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### subscribe()

```ts
subscribe(target): Promise<Subscription>;
```

Defined in: packages/client/src/graphorin-client.ts:239

Subscribe to a server-side event stream. Resolves with a
[Subscription](/api/@graphorin/client/client/interfaces/Subscription.md) once the server confirms with the matching
`subscribed` frame; rejects when the server returns an
`error` instead.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`SubscriptionTarget`](/api/@graphorin/client/client/type-aliases/SubscriptionTarget.md) |

#### Returns

`Promise`\&lt;[`Subscription`](/api/@graphorin/client/client/interfaces/Subscription.md)\&gt;
