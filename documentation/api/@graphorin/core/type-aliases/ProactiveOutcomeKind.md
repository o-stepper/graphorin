[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProactiveOutcomeKind

# Type Alias: ProactiveOutcomeKind

```ts
type ProactiveOutcomeKind = "notify" | "question" | "review" | "act";
```

Defined in: packages/core/src/types/proactive.ts:27

**`Stable`**

The four rungs of the proactive escalation ladder, in escalation
order. `notify` is fire-and-forget delivery; `question` asks the
user for input the task needs; `review` asks the user to approve a
proposed action before anything happens; `act` means the task was
granted the right to perform side effects without asking first.
