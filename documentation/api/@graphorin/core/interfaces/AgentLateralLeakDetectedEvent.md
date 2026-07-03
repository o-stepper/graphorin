[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentLateralLeakDetectedEvent

# Interface: AgentLateralLeakDetectedEvent

Defined in: packages/core/src/types/agent-event.ts:479

Emitted when the lateral-leak defense layer flags or blocks a
suspected leak.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:483 |
| <a id="property-causalitychain"></a> `causalityChain` | `readonly` | readonly `string`[] | packages/core/src/types/agent-event.ts:486 |
| <a id="property-decision"></a> `decision` | `readonly` | `"strip"` \| `"block"` \| `"detect"` \| `"flag"` | packages/core/src/types/agent-event.ts:489 |
| <a id="property-detectedatiso"></a> `detectedAtIso` | `readonly` | `string` | packages/core/src/types/agent-event.ts:490 |
| <a id="property-matchedpattern"></a> `matchedPattern?` | `readonly` | `string` | packages/core/src/types/agent-event.ts:488 |
| <a id="property-messagecontentsha256"></a> `messageContentSha256` | `readonly` | `string` | packages/core/src/types/agent-event.ts:487 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:481 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:482 |
| <a id="property-severity"></a> `severity` | `readonly` | `"info"` \| `"warn"` \| `"block"` | packages/core/src/types/agent-event.ts:485 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.lateral-leak.detected"` | packages/core/src/types/agent-event.ts:480 |
| <a id="property-vector"></a> `vector` | `readonly` | [`LateralLeakVector`](/api/@graphorin/core/type-aliases/LateralLeakVector.md) | packages/core/src/types/agent-event.ts:484 |
