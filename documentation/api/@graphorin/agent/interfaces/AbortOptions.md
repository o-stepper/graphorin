[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AbortOptions

# Interface: AbortOptions

Defined in: packages/agent/src/types.ts:247

Cancellation options accepted by `agent.abort({...})`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-drain"></a> `drain?` | `readonly` | `boolean` | Wait for the current step to complete before stopping. | packages/agent/src/types.ts:249 |
| <a id="property-onpendingapprovals"></a> `onPendingApprovals?` | `readonly` | `"deny"` \| `"hold"` \| `"fail"` | What to do with approvals that were already requested but not resolved at abort time. - `'deny'` (default) — auto-deny pending approvals. - `'hold'` — keep the approvals on `RunState.pendingApprovals`. - `'fail'` — reject the run with `RunError(code: 'run-aborted')`. | packages/agent/src/types.ts:258 |
