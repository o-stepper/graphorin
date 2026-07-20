[**Graphorin API reference v0.13.7**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [facade](/api/@graphorin/sessions/facade/index.md) / SessionMemoryFacade

# Interface: SessionMemoryFacade

Defined in: packages/sessions/src/facade.ts:84

**`Stable`**

Subset of the `Memory.session` surface this package consumes. Kept
structural so callers can pass either the `Memory` facade from
`@graphorin/memory` or any custom shim with the same shape.

## Methods

### compact()?

```ts
optional compact(scope, opts?): Promise<{
  removed: number;
  summarized: number;
  summary?: string;
}>;
```

Defined in: packages/sessions/src/facade.ts:107

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | \{ `keepLastN?`: `number`; \} |
| `opts.keepLastN?` | `number` |

#### Returns

`Promise`\<\{
  `removed`: `number`;
  `summarized`: `number`;
  `summary?`: `string`;
\}\>

***

### flushImportant()?

```ts
optional flushImportant(scope, opts?): Promise<{
  flushed: number;
}>;
```

Defined in: packages/sessions/src/facade.ts:106

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | \{ `silent?`: `boolean`; \} |
| `opts.silent?` | `boolean` |

#### Returns

`Promise`\<\{
  `flushed`: `number`;
\}\>

***

### list()

```ts
list(scope, opts?): Promise<readonly Message[]>;
```

Defined in: packages/sessions/src/facade.ts:90

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | [`SessionListOptions`](/api/@graphorin/core/interfaces/SessionListOptions.md) |

#### Returns

`Promise`\&lt;readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]\&gt;

***

### listWithMetadata()?

```ts
optional listWithMetadata(scope, opts?): Promise<readonly SessionMessageWithMetadata[]>;
```

Defined in: packages/sessions/src/facade.ts:97

List messages with their persisted identity: the stored message id,
sequence, and `createdAt`. Optional - when absent, export falls back to
fabricating those fields (the legacy behaviour). Implemented by
`@graphorin/memory.session` over the store's real rows.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | [`SessionListOptions`](/api/@graphorin/core/interfaces/SessionListOptions.md) |

#### Returns

`Promise`\&lt;readonly [`SessionMessageWithMetadata`](/api/@graphorin/sessions/facade/interfaces/SessionMessageWithMetadata.md)[]\&gt;

***

### push()

```ts
push(
   scope, 
   message, 
options?): Promise<MessageRef>;
```

Defined in: packages/sessions/src/facade.ts:85

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `message` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) |
| `options?` | [`SessionMessagePushOptions`](/api/@graphorin/core/interfaces/SessionMessagePushOptions.md) |

#### Returns

`Promise`\&lt;[`MessageRef`](/api/@graphorin/core/interfaces/MessageRef.md)\&gt;

***

### search()

```ts
search(
   scope, 
   query, 
opts?): Promise<readonly MemoryHit<MemoryRecord>[]>;
```

Defined in: packages/sessions/src/facade.ts:101

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `query` | `string` |
| `opts?` | \{ `signal?`: `AbortSignal`; `topK?`: `number`; \} |
| `opts.signal?` | `AbortSignal` |
| `opts.topK?` | `number` |

#### Returns

`Promise`\<readonly [`MemoryHit`](/api/@graphorin/core/interfaces/MemoryHit.md)\&lt;[`MemoryRecord`](/api/@graphorin/core/interfaces/MemoryRecord.md)\&gt;[]\>
