[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AgentLateralLeakDetectedEvent

# Interface: AgentLateralLeakDetectedEvent

Defined in: [packages/core/src/types/agent-event.ts:539](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L539)

Emitted when the lateral-leak defense layer flags or blocks a
suspected leak.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:543](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L543) |
| <a id="property-causalitychain"></a> `causalityChain` | `readonly` | readonly `string`[] | [packages/core/src/types/agent-event.ts:546](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L546) |
| <a id="property-decision"></a> `decision` | `readonly` | `"strip"` \| `"block"` \| `"detect"` \| `"flag"` | [packages/core/src/types/agent-event.ts:549](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L549) |
| <a id="property-detectedatiso"></a> `detectedAtIso` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:550](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L550) |
| <a id="property-matchedpattern"></a> `matchedPattern?` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:548](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L548) |
| <a id="property-messagecontentsha256"></a> `messageContentSha256` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:547](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L547) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:541](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L541) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:542](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L542) |
| <a id="property-severity"></a> `severity` | `readonly` | `"info"` \| `"warn"` \| `"block"` | [packages/core/src/types/agent-event.ts:545](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L545) |
| <a id="property-type"></a> `type` | `readonly` | `"agent.lateral-leak.detected"` | [packages/core/src/types/agent-event.ts:540](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L540) |
| <a id="property-vector"></a> `vector` | `readonly` | [`LateralLeakVector`](/api/@graphorin/core/type-aliases/LateralLeakVector.md) | [packages/core/src/types/agent-event.ts:544](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L544) |
