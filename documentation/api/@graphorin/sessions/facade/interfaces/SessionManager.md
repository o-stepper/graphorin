[**Graphorin API reference v0.6.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [facade](/api/@graphorin/sessions/facade/index.md) / SessionManager

# Interface: SessionManager

Defined in: packages/sessions/src/facade.ts:290

Surface returned by [createSessionManager](/api/@graphorin/sessions/facade/functions/createSessionManager.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agents"></a> `agents` | `readonly` | [`AgentRegistry`](/api/@graphorin/sessions/agent-registry/classes/AgentRegistry.md) | The underlying agent registry. | packages/sessions/src/facade.ts:292 |
| <a id="property-commentary"></a> `commentary` | `readonly` | [`CommentarySanitizer`](/api/@graphorin/sessions/interfaces/CommentarySanitizer.md) | Default sanitizer instance (test seam). | packages/sessions/src/facade.ts:294 |

## Methods

### create()

```ts
create(args): Promise<Session>;
```

Defined in: packages/sessions/src/facade.ts:302

Create a fresh session. The optional `commentaryPolicy` overrides
the manager-level default just for this session - useful for
deployments that pin a stricter posture per-conversation (e.g.
`'strip'` for compliance-sensitive sessions while everything else
uses the `'wrap'` default).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `agentId`: `string`; `commentaryPolicy?`: [`CommentaryPolicy`](/api/@graphorin/sessions/type-aliases/CommentaryPolicy.md); `sessionId?`: `string`; `tags?`: readonly `string`[]; `title?`: `string`; `userId`: `string`; \} |
| `args.agentId` | `string` |
| `args.commentaryPolicy?` | [`CommentaryPolicy`](/api/@graphorin/sessions/type-aliases/CommentaryPolicy.md) |
| `args.sessionId?` | `string` |
| `args.tags?` | readonly `string`[] |
| `args.title?` | `string` |
| `args.userId` | `string` |

#### Returns

`Promise`\&lt;[`Session`](/api/@graphorin/sessions/facade/interfaces/Session.md)\&gt;

***

### deleteSession()

```ts
deleteSession(sessionId): Promise<void>;
```

Defined in: packages/sessions/src/facade.ts:322

Hard-delete a session and cascade its handoffs / workflow runs / audit rows
(RP-6). Message rows are owned by the memory store; purge them separately.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### find()

```ts
find(sessionId): Promise<
  | Session
| null>;
```

Defined in: packages/sessions/src/facade.ts:313

Best-effort lookup. Returns `null` when the id is unknown.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |

#### Returns

`Promise`\<
  \| [`Session`](/api/@graphorin/sessions/facade/interfaces/Session.md)
  \| `null`\>

***

### get()

```ts
get(sessionId): Promise<Session>;
```

Defined in: packages/sessions/src/facade.ts:311

Hydrate an existing session by id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |

#### Returns

`Promise`\&lt;[`Session`](/api/@graphorin/sessions/facade/interfaces/Session.md)\&gt;

***

### importFromString()

```ts
importFromString(body, opts?): Promise<{
  read: SessionExportReadResult;
  session:   | Session
     | null;
}>;
```

Defined in: packages/sessions/src/facade.ts:332

Import a JSONL stream into a fresh session.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `string` |
| `opts?` | [`SessionExportReadOptions`](/api/@graphorin/sessions/interfaces/SessionExportReadOptions.md) |

#### Returns

`Promise`\<\{
  `read`: [`SessionExportReadResult`](/api/@graphorin/sessions/interfaces/SessionExportReadResult.md);
  `session`:   \| [`Session`](/api/@graphorin/sessions/facade/interfaces/Session.md)
     \| `null`;
\}\>

***

### listSessions()

```ts
listSessions(scope): Promise<readonly SessionMetadata[]>;
```

Defined in: packages/sessions/src/facade.ts:315

List sessions for a scope (newest-first by `createdAt`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | `Pick`\&lt;[`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md), `"userId"` \| `"agentId"`\&gt; |

#### Returns

`Promise`\&lt;readonly [`SessionMetadata`](/api/@graphorin/core/interfaces/SessionMetadata.md)[]\&gt;

***

### pruneAudit()

```ts
pruneAudit(beforeEpochMs): Promise<number>;
```

Defined in: packages/sessions/src/facade.ts:339

Prune audit rows older than the supplied epoch ms.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `beforeEpochMs` | `number` |

#### Returns

`Promise`\&lt;`number`\&gt;

***

### pruneSessions()

```ts
pruneSessions(opts): Promise<number>;
```

Defined in: packages/sessions/src/facade.ts:327

Retention sweep (RP-6): delete every session matching the policy. Returns
the count deleted. See [SessionStoreExt.pruneSessions](/api/@graphorin/core/interfaces/SessionStoreExt.md#prunesessions).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `beforeEpochMs?`: `number`; `closedOnly?`: `boolean`; \} |
| `opts.beforeEpochMs?` | `number` |
| `opts.closedOnly?` | `boolean` |

#### Returns

`Promise`\&lt;`number`\&gt;

***

### replayer()

```ts
replayer(): SessionReplayer;
```

Defined in: packages/sessions/src/facade.ts:337

Build the underlying replay engine for advanced consumers.

#### Returns

[`SessionReplayer`](/api/@graphorin/sessions/interfaces/SessionReplayer.md)
