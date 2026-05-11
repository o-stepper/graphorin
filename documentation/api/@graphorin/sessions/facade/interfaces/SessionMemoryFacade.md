[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [facade](/api/@graphorin/sessions/facade/index.md) / SessionMemoryFacade

# Interface: SessionMemoryFacade

Defined in: packages/sessions/src/facade.ts:82

Subset of the `Memory.session` surface this package consumes. Kept
structural so callers can pass either the `Memory` facade from
`@graphorin/memory` or any custom shim with the same shape.

## Stable

## Methods

### compact()?

```ts
optional compact(scope, opts?): Promise<{
  removed: number;
  summarized: number;
  summary?: string;
}>;
```

Defined in: packages/sessions/src/facade.ts:91

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

Defined in: packages/sessions/src/facade.ts:90

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

Defined in: packages/sessions/src/facade.ts:84

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `opts?` | [`SessionListOptions`](/api/@graphorin/core/interfaces/SessionListOptions.md) |

#### Returns

`Promise`\&lt;readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]\&gt;

***

### push()

```ts
push(scope, message): Promise<MessageRef>;
```

Defined in: packages/sessions/src/facade.ts:83

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`SessionScope`](/api/@graphorin/core/interfaces/SessionScope.md) |
| `message` | [`Message`](/api/@graphorin/core/type-aliases/Message.md) |

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

Defined in: packages/sessions/src/facade.ts:85

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
