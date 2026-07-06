[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / ServerWorkflowLike

# Interface: ServerWorkflowLike

Defined in: packages/server/src/registry/index.ts:60

Minimal shape the server needs from a `Workflow`. Mirrors the
`Workflow` surface from `@graphorin/workflow`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | packages/server/src/registry/index.ts:61 |

## Methods

### deleteThread()?

```ts
optional deleteThread(threadId): Promise<void>;
```

Defined in: packages/server/src/registry/index.ts:93

W-005: per-thread checkpoint erasure (`DELETE /:id/threads/:threadId`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\<`void`\>

***

### execute()

```ts
execute(input, options?): AsyncIterable<unknown>;
```

Defined in: packages/server/src/registry/index.ts:62

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `unknown` |
| `options?` | \{ `signal?`: `AbortSignal`; `threadId?`: `string`; \} |
| `options.signal?` | `AbortSignal` |
| `options.threadId?` | `string` |

#### Returns

`AsyncIterable`\<`unknown`\>

***

### fork()?

```ts
optional fork(threadId, fromCheckpointId): Promise<{
  newThreadId: string;
}>;
```

Defined in: packages/server/src/registry/index.ts:89

W-119: fork a new thread from a checkpoint (`POST /:id/fork`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `fromCheckpointId` | `string` |

#### Returns

`Promise`\<\{
  `newThreadId`: `string`;
\}\>

***

### getState()?

```ts
optional getState(threadId): Promise<unknown>;
```

Defined in: packages/server/src/registry/index.ts:90

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\<`unknown`\>

***

### listCheckpoints()?

```ts
optional listCheckpoints(threadId): Promise<readonly unknown[]>;
```

Defined in: packages/server/src/registry/index.ts:91

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\<readonly `unknown`[]\>

***

### resolveAwakeable()?

```ts
optional resolveAwakeable(
   threadId, 
   name, 
   value?, 
opts?): AsyncIterable<unknown>;
```

Defined in: packages/server/src/registry/index.ts:82

W-119: resolve a NAMED awakeable/approval (`POST /:id/resume` with
`name`) - `approve` is the same primitive under the hood.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `name` | `string` |
| `value?` | `unknown` |
| `opts?` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

#### Returns

`AsyncIterable`\<`unknown`\>

***

### resume()?

```ts
optional resume(
   threadId, 
   directive?, 
opts?): AsyncIterable<unknown>;
```

Defined in: packages/server/src/registry/index.ts:66

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `directive?` | \{ `resume?`: `unknown`; \} |
| `directive.resume?` | `unknown` |
| `opts?` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

#### Returns

`AsyncIterable`\<`unknown`\>

***

### retry()?

```ts
optional retry(threadId, opts?): AsyncIterable<unknown>;
```

Defined in: packages/server/src/registry/index.ts:72

W-119: replay a failed/aborted thread (`POST /:id/retry`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `opts?` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

#### Returns

`AsyncIterable`\<`unknown`\>

***

### tick()?

```ts
optional tick(threadId, opts?): Promise<{
  fired: boolean;
  nextWakeAt: number | null;
}>;
```

Defined in: packages/server/src/registry/index.ts:74

W-119: fire a due durable timer (`POST /:id/tick`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `opts?` | \{ `now?`: `number`; \} |
| `opts.now?` | `number` |

#### Returns

`Promise`\<\{
  `fired`: `boolean`;
  `nextWakeAt`: `number` \| `null`;
\}\>
