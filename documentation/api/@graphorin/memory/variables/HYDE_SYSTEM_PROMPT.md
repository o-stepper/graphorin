[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / HYDE\_SYSTEM\_PROMPT

# Variable: HYDE\_SYSTEM\_PROMPT

```ts
const HYDE_SYSTEM_PROMPT: string;
```

Defined in: [packages/memory/src/search/query-transform.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/search/query-transform.ts#L97)

**`Internal`**

System prompt for HyDE. Asks for a short, plausible hypothetical
answer (not a question rephrase) whose embedding sits near the
passage that would actually answer the query.
