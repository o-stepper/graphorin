[**Graphorin API reference v0.11.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / ServerWorkflowLike

# Interface: ServerWorkflowLike

Defined in: [packages/server/src/registry/index.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L73)

Minimal shape the server needs from a `Workflow`. Mirrors the
`Workflow` surface from `@graphorin/workflow`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | [packages/server/src/registry/index.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L74) |

## Methods

### deleteThread()?

```ts
optional deleteThread(threadId): Promise<void>;
```

Defined in: [packages/server/src/registry/index.ts:114](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L114)

W-005: per-thread checkpoint erasure (`DELETE /:id/threads/:threadId`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;

***

### execute()

```ts
execute(input, options?): AsyncIterable<unknown>;
```

Defined in: [packages/server/src/registry/index.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L75)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `unknown` |
| `options?` | \{ `signal?`: `AbortSignal`; `threadId?`: `string`; \} |
| `options.signal?` | `AbortSignal` |
| `options.threadId?` | `string` |

#### Returns

`AsyncIterable`\&lt;`unknown`\&gt;

***

### fork()?

```ts
optional fork(
   threadId, 
   fromCheckpointId, 
   opts?): Promise<{
  newThreadId: string;
}>;
```

Defined in: [packages/server/src/registry/index.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L106)

W-119: fork a new thread from a checkpoint (`POST /:id/fork`). E2:
`opts.patch` merges channel-level state into the forked root (the
`state` field of the fork body).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `fromCheckpointId` | `string` |
| `opts?` | \{ `patch?`: `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>; \} |
| `opts.patch?` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> |

#### Returns

`Promise`\<\{
  `newThreadId`: `string`;
\}\>

***

### getState()?

```ts
optional getState(threadId): Promise<unknown>;
```

Defined in: [packages/server/src/registry/index.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L111)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\&lt;`unknown`\&gt;

***

### listCheckpoints()?

```ts
optional listCheckpoints(threadId): Promise<readonly unknown[]>;
```

Defined in: [packages/server/src/registry/index.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L112)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |

#### Returns

`Promise`\&lt;readonly `unknown`[]\&gt;

***

### resolveAwakeable()?

```ts
optional resolveAwakeable(
   threadId, 
   name, 
   value?, 
opts?): AsyncIterable<unknown>;
```

Defined in: [packages/server/src/registry/index.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L95)

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

`AsyncIterable`\&lt;`unknown`\&gt;

***

### resume()?

```ts
optional resume(
   threadId, 
   directive?, 
opts?): AsyncIterable<unknown>;
```

Defined in: [packages/server/src/registry/index.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L79)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `directive?` | \{ `resume?`: `unknown`; \} |
| `directive.resume?` | `unknown` |
| `opts?` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

#### Returns

`AsyncIterable`\&lt;`unknown`\&gt;

***

### retry()?

```ts
optional retry(threadId, opts?): AsyncIterable<unknown>;
```

Defined in: [packages/server/src/registry/index.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L85)

W-119: replay a failed/aborted thread (`POST /:id/retry`).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `threadId` | `string` |
| `opts?` | \{ `signal?`: `AbortSignal`; \} |
| `opts.signal?` | `AbortSignal` |

#### Returns

`AsyncIterable`\&lt;`unknown`\&gt;

***

### tick()?

```ts
optional tick(threadId, opts?): Promise<{
  fired: boolean;
  nextWakeAt: number | null;
}>;
```

Defined in: [packages/server/src/registry/index.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L87)

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
