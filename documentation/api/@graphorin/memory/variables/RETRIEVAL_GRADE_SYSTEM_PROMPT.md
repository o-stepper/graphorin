[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / RETRIEVAL\_GRADE\_SYSTEM\_PROMPT

# Variable: RETRIEVAL\_GRADE\_SYSTEM\_PROMPT

```ts
const RETRIEVAL_GRADE_SYSTEM_PROMPT: string;
```

Defined in: packages/memory/src/search/iterative.ts:224

**`Internal`**

System prompt for the retrieval grader. Asks for a bare JSON verdict;
[parseGrade](/api/@graphorin/memory/functions/parseGrade.md) also tolerates a chatty model.
