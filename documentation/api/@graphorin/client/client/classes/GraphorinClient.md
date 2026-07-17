[**Graphorin API reference v0.12.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [client](/api/@graphorin/client/client/index.md) / GraphorinClient

# Class: GraphorinClient

Defined in: [packages/client/src/graphorin-client.ts:225](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L225)

## Stable

## Constructors

### Constructor

```ts
new GraphorinClient(options): GraphorinClient;
```

Defined in: [packages/client/src/graphorin-client.ts:247](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L247)

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

Defined in: [packages/client/src/graphorin-client.ts:509](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L509)

Return the active transport kind (or `undefined` if not connected).

##### Returns

  \| [`TransportKind`](/api/@graphorin/client/type-aliases/TransportKind.md)
  \| `undefined`

## Methods

### cancel()

```ts
cancel(runId, opts?): Promise<unknown>;
```

Defined in: [packages/client/src/graphorin-client.ts:382](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L382)

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

Defined in: [packages/client/src/graphorin-client.ts:466](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L466)

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

Defined in: [packages/client/src/graphorin-client.ts:262](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L262)

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

Defined in: [packages/client/src/graphorin-client.ts:484](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L484)

Disconnect the underlying transport and abort every pending RPC
+ subscription. Idempotent.

#### Returns

`Promise`\&lt;`void`\&gt;

***

### ping()

```ts
ping(): Promise<void>;
```

Defined in: [packages/client/src/graphorin-client.ts:296](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L296)

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

Defined in: [packages/client/src/graphorin-client.ts:418](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L418)

Resume a paused (HITL) run. The WebSocket protocol intentionally
does NOT carry a `resume` control message - resumes are durable
+ idempotent + body-carrying, which maps onto the REST endpoint
`POST /v1/runs/:runId/resume`. Since C3/W-119 the server resumes
in-process suspensions for real: pass
`{ approvals: [{ toolCallId, granted }] }` as the directive; a run
whose RunState this server process does not retain answers 409
(`run-state-unavailable`) - resume those library-side via
`agent.run(savedState, { directive })`.

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
subscribe(target, opts?): Promise<Subscription>;
```

Defined in: [packages/client/src/graphorin-client.ts:306](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L306)

Subscribe to a server-side event stream. Resolves with a
[Subscription](/api/@graphorin/client/client/interfaces/Subscription.md) once the server confirms with the matching
`subscribed` frame; rejects when the server returns an
`error` instead.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `target` | [`SubscriptionTarget`](/api/@graphorin/client/client/type-aliases/SubscriptionTarget.md) |
| `opts?` | \{ `sinceEventId?`: `string`; \} |
| `opts.sinceEventId?` | `string` |

#### Returns

`Promise`\&lt;[`Subscription`](/api/@graphorin/client/client/interfaces/Subscription.md)\&gt;
