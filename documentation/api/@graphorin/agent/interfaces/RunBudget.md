[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / RunBudget

# Interface: RunBudget

Defined in: packages/agent/src/types.ts:599

**`Stable`**

Run-level budget. Enforced as a
between-step precheck against the run's accumulated usage - the step
that crosses a ceiling completes (in-flight overshoot is inherent to
between-step enforcement, exactly like the consolidator's
`BudgetTracker`), and the run stops before the next provider call.
Sub-agent usage is included: handoff / `toTool` children fold their
usage into the parent run's accounting.

The cost leg reads `Usage.cost`, which only exists when the provider
chain reports it (wire `withCostTracking` from `@graphorin/provider`
with a `@graphorin/pricing` snapshot). A cost ceiling without USD
cost data is fail-closed by default: the run stops at the first
between-step check (`onUnpriced: 'fail'`) instead of spending
unmetered - see [RunBudget.onUnpriced](/api/@graphorin/agent/interfaces/RunBudget.md#property-onunpriced) for the opt-out and
`maxTokens` for a provider-independent ceiling.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxcostusd"></a> `maxCostUsd?` | `readonly` | `number` | Maximum cumulative run cost in USD (sub-agents included). | packages/agent/src/types.ts:601 |
| <a id="property-maxtokens"></a> `maxTokens?` | `readonly` | `number` | Maximum cumulative run tokens (`Usage.totalTokens`, sub-agents included). Provider-independent - enforced even without pricing middleware. | packages/agent/src/types.ts:607 |
| <a id="property-onexceed"></a> `onExceed?` | `readonly` | `"stop"` \| `"throw"` | What to do when a ceiling is crossed. `'stop'` (default) ends the run through the normal terminal path: the result resolves with `status: 'failed'` and `error.code: 'budget-exceeded'` (the stop-condition-cut precedent), so the resumable partial state stays on the result. `'throw'` rejects the run with [AgentBudgetExceededError](/api/@graphorin/agent/errors/classes/AgentBudgetExceededError.md) after emitting `agent.error` - graceful finalization (final checkpoint, `agent.end`) is skipped. | packages/agent/src/types.ts:617 |
| <a id="property-onunpriced"></a> `onUnpriced?` | `readonly` | `"warn"` \| `"fail"` | What to do when `maxCostUsd` is set but the accumulated usage carries no USD cost data, so the ceiling cannot observe spend. `'fail'` (default) is fail-closed: the run stops at the first between-step check in the `onExceed` shape (`'stop'` fails the run with `error.code: 'budget-unpriced'`; `'throw'` rejects with `AgentBudgetUnpricedError`) - a caller who set a cost cap must never keep spending unmetered. `'warn'` restores the pre-0.13 behaviour: one console WARN, ceiling unenforced. Wire `withCostTracking` with a pricing snapshot, or use `maxTokens` for a provider-independent ceiling. | packages/agent/src/types.ts:630 |
