[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentLateralLeakDetectedEvent

# Interface: AgentLateralLeakDetectedEvent

Defined in: packages/core/src/types/agent-event.ts:519

Emitted when the lateral-leak defense layer flags or blocks a
suspected leak.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:523 |
| <a id="property-causalitychain"></a> `causalityChain` | `readonly` | readonly `string`[] | packages/core/src/types/agent-event.ts:526 |
| <a id="property-decision"></a> `decision` | `readonly` | `"strip"` \| `"block"` \| `"detect"` \| `"flag"` | packages/core/src/types/agent-event.ts:529 |
| <a id="property-detectedatiso"></a> `detectedAtIso` | `readonly` | `string` | packages/core/src/types/agent-event.ts:530 |
| <a id="property-matchedpattern"></a> `matchedPattern?` | `readonly` | `string` | packages/core/src/types/agent-event.ts:528 |
| <a id="property-messagecontentsha256"></a> `messageContentSha256` | `readonly` | `string` | packages/core/src/types/agent-event.ts:527 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:521 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:522 |
| <a id="property-severity"></a> `severity` | `readonly` | `"info"` \| `"warn"` \| `"block"` | packages/core/src/types/agent-event.ts:525 |
| <a id="property-type"></a> `type` | `readonly` | `"agent.lateral-leak.detected"` | packages/core/src/types/agent-event.ts:520 |
| <a id="property-vector"></a> `vector` | `readonly` | [`LateralLeakVector`](/api/@graphorin/core/type-aliases/LateralLeakVector.md) | packages/core/src/types/agent-event.ts:524 |
