[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / OnBudgetExceed

# Type Alias: OnBudgetExceed

```ts
type OnBudgetExceed = "pause" | "log" | "throw";
```

Defined in: packages/memory/src/consolidator/types.ts:134

**`Stable`**

Behaviour applied by the budget enforcer when a ceiling is hit
mid-run. `'pause'` is the conservative default - the consolidator
skips subsequent runs until the next budget reset; `'log'` keeps
running with a WARN; `'throw'` raises a typed
[BudgetExceededError](/api/@graphorin/memory/classes/BudgetExceededError.md).
