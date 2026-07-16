[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ContextCompactedEvent

# Interface: ContextCompactedEvent

Defined in: [packages/core/src/types/agent-event.ts:244](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L244)

Emitted when the runtime auto-compacts the in-flight session
message-history to fit the context window.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-aftertokens"></a> `afterTokens` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:250](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L250) |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:248](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L248) |
| <a id="property-beforetokens"></a> `beforeTokens` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:249](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L249) |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:252](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L252) |
| <a id="property-hooksfiredcount"></a> `hooksFiredCount` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:254](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L254) |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:246](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L246) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/core/src/types/agent-event.ts:247](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L247) |
| <a id="property-source"></a> `source` | `readonly` | `"manual"` \| `"auto-trigger"` \| `"pre-step"` | [packages/core/src/types/agent-event.ts:253](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L253) |
| <a id="property-summarytokens"></a> `summaryTokens` | `readonly` | `number` | [packages/core/src/types/agent-event.ts:251](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L251) |
| <a id="property-type"></a> `type` | `readonly` | `"context.compacted"` | [packages/core/src/types/agent-event.ts:245](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L245) |
