[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / MemoryApi

# Interface: MemoryApi

Defined in: packages/server/src/routes/memory.ts:58

**`Stable`**

## Methods

### deleteBlock()

```ts
deleteBlock(scope, label): Promise<boolean>;
```

Defined in: packages/server/src/routes/memory.ts:63

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | \{ `userId`: `string`; \} |
| `scope.userId` | `string` |
| `label` | `string` |

#### Returns

`Promise`\&lt;`boolean`\&gt;

***

### forget()

```ts
forget(scope, factId): Promise<boolean>;
```

Defined in: packages/server/src/routes/memory.ts:61

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | \{ `userId`: `string`; \} |
| `scope.userId` | `string` |
| `factId` | `string` |

#### Returns

`Promise`\&lt;`boolean`\&gt;

***

### remember()

```ts
remember(input): Promise<{
  factId: string;
}>;
```

Defined in: packages/server/src/routes/memory.ts:60

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `metadata?`: `Record`\&lt;`string`, `unknown`\&gt;; `scope`: \{ `agentId?`: `string`; `sessionId?`: `string`; `userId`: `string`; \}; `sensitivity?`: `"public"` \| `"internal"` \| `"secret"`; `text`: `string`; \} |
| `input.metadata?` | `Record`\&lt;`string`, `unknown`\&gt; |
| `input.scope` | \{ `agentId?`: `string`; `sessionId?`: `string`; `userId`: `string`; \} |
| `input.scope.agentId?` | `string` |
| `input.scope.sessionId?` | `string` |
| `input.scope.userId` | `string` |
| `input.sensitivity?` | `"public"` \| `"internal"` \| `"secret"` |
| `input.text` | `string` |

#### Returns

`Promise`\<\{
  `factId`: `string`;
\}\>

***

### search()

```ts
search(input): Promise<readonly unknown[]>;
```

Defined in: packages/server/src/routes/memory.ts:59

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `query`: `string`; `scope`: \{ `agentId?`: `string`; `sessionId?`: `string`; `userId`: `string`; \}; `topK?`: `number`; \} |
| `input.query` | `string` |
| `input.scope` | \{ `agentId?`: `string`; `sessionId?`: `string`; `userId`: `string`; \} |
| `input.scope.agentId?` | `string` |
| `input.scope.sessionId?` | `string` |
| `input.scope.userId` | `string` |
| `input.topK?` | `number` |

#### Returns

`Promise`\&lt;readonly `unknown`[]\&gt;

***

### upsertBlock()

```ts
upsertBlock(input): Promise<{
  label: string;
}>;
```

Defined in: packages/server/src/routes/memory.ts:62

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `body`: `string`; `label`: `string`; `scope`: \{ `agentId?`: `string`; `sessionId?`: `string`; `userId`: `string`; \}; \} |
| `input.body` | `string` |
| `input.label` | `string` |
| `input.scope` | \{ `agentId?`: `string`; `sessionId?`: `string`; `userId`: `string`; \} |
| `input.scope.agentId?` | `string` |
| `input.scope.sessionId?` | `string` |
| `input.scope.userId` | `string` |

#### Returns

`Promise`\<\{
  `label`: `string`;
\}\>
