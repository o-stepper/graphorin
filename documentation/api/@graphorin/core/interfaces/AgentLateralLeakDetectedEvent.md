[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentLateralLeakDetectedEvent

# Interface: AgentLateralLeakDetectedEvent

Defined in: packages/core/src/types/agent-event.ts:470

Emitted when the lateral-leak defense layer flags or blocks a
suspected leak.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:474 |
| <a id="property-causalitychain"></a> `causalityChain` | `readonly` | readonly `string`[] | packages/core/src/types/agent-event.ts:477 |
| <a id="property-decision"></a> `decision` | `readonly` | `"strip"` \| `"block"` \| `"detect"` \| `"flag"` | packages/core/src/types/agent-event.ts:480 |
| <a id="property-detectedatiso"></a> `detectedAtIso` | `readonly` | `string` | packages/core/src/types/agent-event.ts:481 |
| <a id="property-matchedpattern"></a> `matchedPattern?` | `readonly` | `string` | packages/core/src/types/agent-event.ts:479 |
| <a id="property-messagecontentsha256"></a> `messageContentSha256` | `readonly` | `string` | packages/core/src/types/agent-event.ts:478 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:472 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:473 |
| <a id="property-severity"></a> `severity` | `readonly` | `"info"` \| `"warn"` \| `"block"` | packages/core/src/types/agent-event.ts:476 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.lateral-leak.detected"` | packages/core/src/types/agent-event.ts:471 |
| <a id="property-vector"></a> `vector` | `readonly` | [`LateralLeakVector`](/api/@graphorin/core/type-aliases/LateralLeakVector.md) | packages/core/src/types/agent-event.ts:475 |
