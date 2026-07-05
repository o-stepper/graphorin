[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AbortOptions

# Interface: AbortOptions

Defined in: packages/agent/src/types.ts:510

Cancellation options accepted by `agent.abort({...})`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-drain"></a> `drain?` | `readonly` | `boolean` | When `true`, let the in-flight provider stream finish (the current step reaches its boundary) instead of interrupting it mid-event, then stop at the next step. Default `false` hard-kills the in-flight stream immediately. (The step's tool calls still observe the cancellation once the signal is set.) | packages/agent/src/types.ts:517 |
| <a id="property-onpendingapprovals"></a> `onPendingApprovals?` | `readonly` | `"deny"` \| `"hold"` \| `"fail"` | What to do with approvals that were already requested but not resolved at abort time. - `'deny'` (default) - auto-deny pending approvals. - `'hold'` - keep the approvals on `RunState.pendingApprovals`. - `'fail'` - reject the run with `RunError(code: 'run-aborted')`. | packages/agent/src/types.ts:526 |
