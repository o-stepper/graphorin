[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / AgentToToolOptions

# Interface: AgentToToolOptions

Defined in: packages/agent/src/types.ts:710

**`Stable`**

`agent.toTool({...})` options.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-capability"></a> `capability?` | `readonly` | `"read-only"` | Run the sub-agent under a restricted capability: a `'read-only'` worker cannot execute or advertise writer tools. The orchestrator-worker recipe is `parent (full capability) + workers via toTool({ capability: 'read-only', contextFold: true })`. | packages/agent/src/types.ts:732 |
| <a id="property-contextfold"></a> `contextFold?` | `readonly` | \| `boolean` \| \{ `maxChars?`: `number`; \} | Context folding at the sub-agent boundary: instead of the raw final output, the parent receives a compact distilled outcome - status, step/tool-call counts, tools used, and the final text clamped to `maxChars` (default 2000). Keeps tool-heavy child runs from flooding the parent window. Default off (raw output). | packages/agent/src/types.ts:740 |
| <a id="property-description"></a> `description?` | `readonly` | `string` | - | packages/agent/src/types.ts:712 |
| <a id="property-exposeturns"></a> `exposeTurns?` | `readonly` | `"none"` \| `"all"` \| `"final"` | - | packages/agent/src/types.ts:713 |
| <a id="property-forwardevents"></a> `forwardEvents?` | `readonly` | [`SubagentForwardPolicy`](/api/@graphorin/agent/type-aliases/SubagentForwardPolicy.md) | Which child events forward into the parent stream. | packages/agent/src/types.ts:725 |
| <a id="property-inputfilter"></a> `inputFilter?` | `readonly` | [`HandoffFilter`](/api/@graphorin/core/type-aliases/HandoffFilter.md) | Shapes the sub-agent seed from the parent history: when supplied, the sub-agent is seeded with `[...inputFilter(parentMessages), { role: 'user', content: input }]`. Without a filter the sub-agent sees ONLY the input string - no parent conversation crosses the boundary (least authority by construction; there is no secret-inheritance mechanism at this boundary at all). | packages/agent/src/types.ts:723 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | - | packages/agent/src/types.ts:711 |
| <a id="property-propagatetaint"></a> `propagateTaint?` | `readonly` | `boolean` | Propagate the child run's coarse taint flags across the fold (default `true`): when the child saw untrusted / sensitive content, the tool result carries a widen-only `taint` override (`sourceKind: 'sub-agent'`) that re-arms the PARENT's data-flow ledger. A no-op when the parent has no `dataFlowPolicy`. Set `false` only for children whose inputs are fully trusted. | packages/agent/src/types.ts:749 |
