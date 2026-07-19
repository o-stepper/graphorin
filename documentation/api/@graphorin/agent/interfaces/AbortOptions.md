[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AbortOptions

# Interface: AbortOptions

Defined in: packages/agent/src/types.ts:757

**`Stable`**

Cancellation options accepted by `agent.abort({...})`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-drain"></a> `drain?` | `readonly` | `boolean` | When `true`, let the in-flight provider stream finish (the current step reaches its boundary) instead of interrupting it mid-event, then stop at the next step. Default `false` hard-kills the in-flight stream immediately. (The step's tool calls still observe the cancellation once the signal is set.) | packages/agent/src/types.ts:764 |
| <a id="property-onpendingapprovals"></a> `onPendingApprovals?` | `readonly` | `"fail"` \| `"deny"` \| `"hold"` | What to do with approvals that were already requested but not resolved at abort time. - `'deny'` (default) - auto-deny pending approvals; each drained toolCallId gets a matching tool message so the transcript keeps no dangling `tool_use`, and the run ends `'aborted'`. - `'hold'` - keep the approvals on `RunState.pendingApprovals` of the `'aborted'` state; such a state re-enters the loop only via an explicit resume directive. - `'fail'` - reject the run with `RunError(code: 'run-aborted')` ONLY when approvals are actually pending; an abort with an empty queue ends `'aborted'`, never `'failed'`. | packages/agent/src/types.ts:779 |
