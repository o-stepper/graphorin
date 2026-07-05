[**Graphorin API reference v0.6.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [evaluator-optimizer](/api/@graphorin/agent/evaluator-optimizer/index.md) / Rubric

# Type Alias: Rubric

```ts
type Rubric = 
  | {
  instructions: string;
  kind: "free-form";
}
  | {
  instructions: string;
  kind: "zod";
}
  | {
  kind: "llm-judge";
  promptTemplate: string;
};
```

Defined in: packages/agent/src/evaluator-optimizer/index.ts:24

Rubric discriminator. Pick the variant that matches your
Evaluator's contract.

## Stable
