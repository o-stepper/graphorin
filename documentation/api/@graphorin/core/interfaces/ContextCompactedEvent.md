[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ContextCompactedEvent

# Interface: ContextCompactedEvent

Defined in: packages/core/src/types/agent-event.ts:207

Emitted when the runtime auto-compacts the in-flight session
message-history to fit the context window.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-aftertokens"></a> `afterTokens` | `readonly` | `number` | packages/core/src/types/agent-event.ts:213 |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:211 |
| <a id="property-beforetokens"></a> `beforeTokens` | `readonly` | `number` | packages/core/src/types/agent-event.ts:212 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | packages/core/src/types/agent-event.ts:215 |
| <a id="property-hooksfiredcount"></a> `hooksFiredCount` | `readonly` | `number` | packages/core/src/types/agent-event.ts:217 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:209 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:210 |
| <a id="property-source"></a> `source` | `readonly` | `"manual"` \| `"auto-trigger"` \| `"pre-step"` | packages/core/src/types/agent-event.ts:216 |
| <a id="property-summarytokens"></a> `summaryTokens` | `readonly` | `number` | packages/core/src/types/agent-event.ts:214 |
| <a id="property-type"></a> `type` | `readonly` | `"context.compacted"` | packages/core/src/types/agent-event.ts:208 |
