[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProactiveOutcome

# Type Alias: ProactiveOutcome

```ts
type ProactiveOutcome = 
  | ProactiveNotifyOutcome
  | ProactiveQuestionOutcome
  | ProactiveReviewOutcome
  | ProactiveActOutcome;
```

Defined in: packages/core/src/types/proactive.ts:148

**`Stable`**

Discriminated union over the four rungs - what a proactive fire
reports to `onOutcome` observers and what the ladder router consumes.
