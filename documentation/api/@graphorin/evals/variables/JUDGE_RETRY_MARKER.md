[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / JUDGE\_RETRY\_MARKER

# Variable: JUDGE\_RETRY\_MARKER

```ts
const JUDGE_RETRY_MARKER: "judge-retries:" = 'judge-retries:';
```

Defined in: packages/evals/src/scorers/llm/judge.ts:49

**`Stable`**

Stable machine-scannable token the scorer puts into the result
`reason` (and `metadata.judgeRetries`) when the judge's FIRST reply
was off-format and the constrained retry recovered a valid
`SCORE: <n>` marker. A recovered grade is a real grade - the case
still passes or fails on its score - but reports can now count the
hidden retries (extra judge calls, extra cost) instead of presenting
a recovered reply as a clean first response.
