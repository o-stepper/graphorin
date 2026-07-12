[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / RunBudget

# Interface: RunBudget

Defined in: [packages/agent/src/types.ts:545](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L545)

Run-level budget (C5 / W-084 residual, decision D-8). Enforced as a
between-step precheck against the run's accumulated usage - the step
that crosses a ceiling completes (in-flight overshoot is inherent to
between-step enforcement, exactly like the consolidator's
`BudgetTracker`), and the run stops before the next provider call.
Sub-agent usage is included: handoff / `toTool` children fold their
usage into the parent run's accounting (W-033).

The cost leg reads `Usage.cost`, which only exists when the provider
chain reports it (wire `withCostTracking` from `@graphorin/provider`
with a `@graphorin/pricing` snapshot). A cost ceiling without USD
cost data is UNENFORCED and WARNs once per run - use `maxTokens` for
a provider-independent ceiling.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxcostusd"></a> `maxCostUsd?` | `readonly` | `number` | Maximum cumulative run cost in USD (sub-agents included). | [packages/agent/src/types.ts:547](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L547) |
| <a id="property-maxtokens"></a> `maxTokens?` | `readonly` | `number` | Maximum cumulative run tokens (`Usage.totalTokens`, sub-agents included). Provider-independent - enforced even without pricing middleware. | [packages/agent/src/types.ts:553](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L553) |
| <a id="property-onexceed"></a> `onExceed?` | `readonly` | `"stop"` \| `"throw"` | What to do when a ceiling is crossed. `'stop'` (default) ends the run through the normal terminal path: the result resolves with `status: 'failed'` and `error.code: 'budget-exceeded'` (the stop-condition-cut precedent), so the resumable partial state stays on the result. `'throw'` rejects the run with [AgentBudgetExceededError](/api/@graphorin/agent/errors/classes/AgentBudgetExceededError.md) after emitting `agent.error` - graceful finalization (final checkpoint, `agent.end`) is skipped. | [packages/agent/src/types.ts:563](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L563) |
