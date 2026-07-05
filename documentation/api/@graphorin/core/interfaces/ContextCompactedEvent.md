[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ContextCompactedEvent

# Interface: ContextCompactedEvent

Defined in: packages/core/src/types/agent-event.ts:193

Emitted when the runtime auto-compacts the in-flight session
message-history to fit the context window.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-aftertokens"></a> `afterTokens` | `readonly` | `number` | packages/core/src/types/agent-event.ts:199 |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:197 |
| <a id="property-beforetokens"></a> `beforeTokens` | `readonly` | `number` | packages/core/src/types/agent-event.ts:198 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | packages/core/src/types/agent-event.ts:201 |
| <a id="property-hooksfiredcount"></a> `hooksFiredCount` | `readonly` | `number` | packages/core/src/types/agent-event.ts:203 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:195 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:196 |
| <a id="property-source"></a> `source` | `readonly` | `"manual"` \| `"auto-trigger"` \| `"pre-step"` | packages/core/src/types/agent-event.ts:202 |
| <a id="property-summarytokens"></a> `summaryTokens` | `readonly` | `number` | packages/core/src/types/agent-event.ts:200 |
| <a id="property-type"></a> `type` | `readonly` | `"context.compacted"` | packages/core/src/types/agent-event.ts:194 |
