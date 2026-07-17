[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / QUERY\_EXPANSION\_SYSTEM\_PROMPT

# Variable: QUERY\_EXPANSION\_SYSTEM\_PROMPT

```ts
const QUERY_EXPANSION_SYSTEM_PROMPT: string;
```

Defined in: [packages/memory/src/search/query-transform.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/query-transform.ts#L83)

**`Internal`**

System prompt for multi-query variant generation. Asks for a bare
JSON array of standalone rephrasings that preserve the original
intent - [parseQueryVariants](/api/@graphorin/memory/functions/parseQueryVariants.md) also tolerates a chatty model.
