[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ToolRanker

# Interface: ToolRanker

Defined in: packages/memory/src/context-engine/tool-budget/types.ts:43

Pluggable similarity ranker the allocator consults when the
eager set exceeds the cap. Mirrors the
`ToolRegistry.searchDeferred(...)` shape from `@graphorin/tools`.

## Stable

## Methods

### search()

```ts
search(query, k?): Promise<readonly {
  score: number;
  toolName: string;
}[]>;
```

Defined in: packages/memory/src/context-engine/tool-budget/types.ts:44

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `k?` | `number` |

#### Returns

`Promise`\<readonly \{
  `score`: `number`;
  `toolName`: `string`;
\}[]\>
