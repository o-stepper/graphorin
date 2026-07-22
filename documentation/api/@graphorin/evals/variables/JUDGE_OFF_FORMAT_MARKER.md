[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / JUDGE\_OFF\_FORMAT\_MARKER

# Variable: JUDGE\_OFF\_FORMAT\_MARKER

```ts
const JUDGE_OFF_FORMAT_MARKER: "judge-off-format:" = 'judge-off-format:';
```

Defined in: packages/evals/src/scorers/llm/judge.ts:36

**`Stable`**

Stable machine-scannable token carried in every
[JudgeOffFormatError](/api/@graphorin/evals/classes/JudgeOffFormatError.md) message. Benchmark runners classify a
case failure whose scorer reason contains this token as a JUDGE
failure (off-format / empty grading reply), never as a subject
quality result.
