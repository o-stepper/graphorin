[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / TruncationStrategy

# Type Alias: TruncationStrategy

```ts
type TruncationStrategy = "middle" | "tail" | "spill-to-file" | "summarize";
```

Defined in: [packages/core/src/types/tool.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L101)

Result-envelope truncation strategy applied to a tool's assembled
output before it reaches the conversation history.

- `'middle'`         - keep head and tail; insert annotation in the
  middle (the default).
- `'tail'`           - keep the tail; insert annotation at the
  head.
- `'spill-to-file'`  - keep the head; spill the un-truncated body
  to a per-run artifact file; insert annotation with the artifact
  path.
- `'summarize'`      - invoke the agent's configured summarizer
  and replace the body with the summary.

## Stable
