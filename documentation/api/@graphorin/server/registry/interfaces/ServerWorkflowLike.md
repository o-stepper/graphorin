[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [registry](/api/@graphorin/server/registry/index.md) / ServerWorkflowLike

# Interface: ServerWorkflowLike

Defined in: [packages/server/src/registry/index.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L60)

Minimal shape the server needs from a `Workflow`. Mirrors the
`Workflow` surface from `@graphorin/workflow`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-name"></a> `name` | `readonly` | `string` | [packages/server/src/registry/index.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L61) |

## Methods

### deleteThread()?

```ts
optional deleteThread(threadId): Promise<void>;
```

Defined in: [packages/server/src/registry/index.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L93)

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

Defined in: [packages/server/src/registry/index.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L62)

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
optional fork(threadId, fromCheckpointId): Promise<{
  newThreadId: string;
}>;
```

Defined in: [packages/server/src/registry/index.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L89)

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

Defined in: [packages/server/src/registry/index.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L90)

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

Defined in: [packages/server/src/registry/index.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L91)

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

Defined in: [packages/server/src/registry/index.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L82)

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

Defined in: [packages/server/src/registry/index.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L66)

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

Defined in: [packages/server/src/registry/index.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L72)

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

Defined in: [packages/server/src/registry/index.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/registry/index.ts#L74)

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
