[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / SubAgentToolRefs

# Interface: SubAgentToolRefs

Defined in: [packages/agent/src/runtime/agent-to-tool.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/runtime/agent-to-tool.ts#L94)

The live references [SUBAGENT\_TOOL](/api/@graphorin/agent/variables/SUBAGENT_TOOL.md) carries (W-001). Typed
loosely on purpose: the walk is generic over foreign TDeps/TOutput
and only ever passes through values it received from the same
factory instance.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentname"></a> `agentName` | `readonly` | `string` | - | [packages/agent/src/runtime/agent-to-tool.ts:95](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/runtime/agent-to-tool.ts#L95) |
| <a id="property-buildseed"></a> `buildSeed` | `readonly` | (`input`, `parentMessages`) => [`AgentInput`](/api/@graphorin/agent/type-aliases/AgentInput.md) | Reproduce `execute()`'s seed semantics (inputFilter + input string). | [packages/agent/src/runtime/agent-to-tool.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/runtime/agent-to-tool.ts#L109) |
| <a id="property-capability"></a> `capability?` | `readonly` | `"read-only"` | D2 capability restriction from `AgentToToolOptions.capability`. | [packages/agent/src/runtime/agent-to-tool.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/runtime/agent-to-tool.ts#L105) |
| <a id="property-forwardevents"></a> `forwardEvents?` | `readonly` | `"none"` \| `"lifecycle"` \| `"all"` | W-036: forwarding policy from `AgentToToolOptions.forwardEvents`. | [packages/agent/src/runtime/agent-to-tool.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/runtime/agent-to-tool.ts#L107) |
| <a id="property-run"></a> `run` | `readonly` | (`input`, `options?`) => `Promise`\<[`AgentResult`](/api/@graphorin/core/interfaces/AgentResult.md)\&lt;`unknown`\&gt;\> | - | [packages/agent/src/runtime/agent-to-tool.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/runtime/agent-to-tool.ts#L96) |
| <a id="property-shapecompleted"></a> `shapeCompleted` | `readonly` | (`result`, `turns`) => \{ `output`: `unknown`; `taint?`: [`SubAgentFoldTaint`](/api/@graphorin/agent/interfaces/SubAgentFoldTaint.md); \} | Reproduce `execute()`'s output shaping (exposeTurns/contextFold/taint). | [packages/agent/src/runtime/agent-to-tool.ts:114](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/runtime/agent-to-tool.ts#L114) |
| <a id="property-stream"></a> `stream` | `readonly` | (`input`, `options?`) => `AsyncIterable`\<[`AgentEvent`](/api/@graphorin/core/type-aliases/AgentEvent.md)\&lt;`unknown`\&gt;\> | - | [packages/agent/src/runtime/agent-to-tool.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/runtime/agent-to-tool.ts#L100) |
