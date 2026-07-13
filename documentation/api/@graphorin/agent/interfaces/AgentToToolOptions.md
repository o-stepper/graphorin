[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AgentToToolOptions

# Interface: AgentToToolOptions

Defined in: [packages/agent/src/types.ts:688](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L688)

`agent.toTool({...})` options.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-capability"></a> `capability?` | `readonly` | `"read-only"` | Run the sub-agent under a restricted capability (D2): a `'read-only'` worker cannot execute or advertise writer tools. The orchestrator-worker recipe is `parent (full capability) + workers via toTool({ capability: 'read-only', contextFold: true })`. | [packages/agent/src/types.ts:710](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L710) |
| <a id="property-contextfold"></a> `contextFold?` | `readonly` | \| `boolean` \| \{ `maxChars?`: `number`; \} | Context folding at the sub-agent boundary (D2): instead of the raw final output, the parent receives a compact distilled outcome - status, step/tool-call counts, tools used, and the final text clamped to `maxChars` (default 2000). Keeps tool-heavy child runs from flooding the parent window. Default off (raw output). | [packages/agent/src/types.ts:718](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L718) |
| <a id="property-description"></a> `description?` | `readonly` | `string` | - | [packages/agent/src/types.ts:690](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L690) |
| <a id="property-exposeturns"></a> `exposeTurns?` | `readonly` | `"none"` \| `"all"` \| `"final"` | - | [packages/agent/src/types.ts:691](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L691) |
| <a id="property-forwardevents"></a> `forwardEvents?` | `readonly` | `SubagentForwardPolicy` | W-036: which child events forward into the parent stream. | [packages/agent/src/types.ts:703](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L703) |
| <a id="property-inputfilter"></a> `inputFilter?` | `readonly` | [`HandoffFilter`](/api/@graphorin/core/type-aliases/HandoffFilter.md) | Shapes the sub-agent seed from the parent history (AG-17): when supplied, the sub-agent is seeded with `[...inputFilter(parentMessages), { role: 'user', content: input }]`. Without a filter the sub-agent sees ONLY the input string - no parent conversation crosses the boundary (least authority by construction; there is no secret-inheritance mechanism at this boundary at all). | [packages/agent/src/types.ts:701](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L701) |
| <a id="property-name"></a> `name?` | `readonly` | `string` | - | [packages/agent/src/types.ts:689](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L689) |
| <a id="property-propagatetaint"></a> `propagateTaint?` | `readonly` | `boolean` | Propagate the child run's coarse taint flags across the fold (D2, default `true`): when the child saw untrusted / sensitive content, the tool result carries a widen-only `taint` override (`sourceKind: 'sub-agent'`) that re-arms the PARENT's data-flow ledger. A no-op when the parent has no `dataFlowPolicy`. Set `false` only for children whose inputs are fully trusted. | [packages/agent/src/types.ts:727](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L727) |
