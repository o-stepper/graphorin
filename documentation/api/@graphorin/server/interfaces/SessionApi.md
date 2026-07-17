[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / SessionApi

# Interface: SessionApi

Defined in: [packages/server/src/routes/sessions.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/sessions.ts#L32)

Minimal contract route handlers consume. Real deployments wire
`@graphorin/sessions.SessionManager` in directly; tests pass a
lighter stub.

## Stable

## Methods

### create()

```ts
create(input): Promise<unknown>;
```

Defined in: [packages/server/src/routes/sessions.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/sessions.ts#L38)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `agentId`: `string`; `sessionId?`: `string`; `tags?`: readonly `string`[]; `title?`: `string`; `userId`: `string`; \} |
| `input.agentId` | `string` |
| `input.sessionId?` | `string` |
| `input.tags?` | readonly `string`[] |
| `input.title?` | `string` |
| `input.userId` | `string` |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### exportSession()?

```ts
optional exportSession(sessionId, opts): Promise<unknown>;
```

Defined in: [packages/server/src/routes/sessions.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/sessions.ts#L51)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |
| `opts` | \{ `hash?`: `boolean`; `includeAuditEntries?`: `boolean`; \} |
| `opts.hash?` | `boolean` |
| `opts.includeAuditEntries?` | `boolean` |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### get()

```ts
get(sessionId): Promise<unknown>;
```

Defined in: [packages/server/src/routes/sessions.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/sessions.ts#L37)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### list()

```ts
list(opts): Promise<readonly unknown[]>;
```

Defined in: [packages/server/src/routes/sessions.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/sessions.ts#L33)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | \{ `agentId?`: `string`; `userId?`: `string`; \} |
| `opts.agentId?` | `string` |
| `opts.userId?` | `string` |

#### Returns

`Promise`\&lt;readonly `unknown`[]\&gt;

***

### listHandoffs()

```ts
listHandoffs(sessionId): Promise<readonly unknown[]>;
```

Defined in: [packages/server/src/routes/sessions.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/sessions.ts#L50)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |

#### Returns

`Promise`\&lt;readonly `unknown`[]\&gt;

***

### listMessages()

```ts
listMessages(sessionId, opts): Promise<readonly unknown[]>;
```

Defined in: [packages/server/src/routes/sessions.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/sessions.ts#L46)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |
| `opts` | \{ `limit?`: `number`; \} |
| `opts.limit?` | `number` |

#### Returns

`Promise`\&lt;readonly `unknown`[]\&gt;

***

### remove()

```ts
remove(sessionId): Promise<boolean>;
```

Defined in: [packages/server/src/routes/sessions.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/sessions.ts#L45)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |

#### Returns

`Promise`\&lt;`boolean`\&gt;

***

### replaySession()?

```ts
optional replaySession(sessionId, opts): AsyncIterable<unknown>;
```

Defined in: [packages/server/src/routes/sessions.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/routes/sessions.ts#L58)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sessionId` | `string` |
| `opts` | \{ `fromMessageId?`: `string`; `raw?`: `boolean`; \} |
| `opts.fromMessageId?` | `string` |
| `opts.raw?` | `boolean` |

#### Returns

`AsyncIterable`\&lt;`unknown`\&gt;
