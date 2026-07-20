[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ContextCompactedEvent

# Interface: ContextCompactedEvent

Defined in: packages/core/src/types/agent-event.ts:268

**`Stable`**

Emitted when the runtime auto-compacts the in-flight session
message-history to fit the context window.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-aftertokens"></a> `afterTokens` | `readonly` | `number` | packages/core/src/types/agent-event.ts:274 |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:272 |
| <a id="property-beforetokens"></a> `beforeTokens` | `readonly` | `number` | packages/core/src/types/agent-event.ts:273 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | packages/core/src/types/agent-event.ts:276 |
| <a id="property-hooksfiredcount"></a> `hooksFiredCount` | `readonly` | `number` | packages/core/src/types/agent-event.ts:278 |
| <a id="property-runid"></a> `runId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:270 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/types/agent-event.ts:271 |
| <a id="property-source"></a> `source` | `readonly` | `"manual"` \| `"auto-trigger"` \| `"pre-step"` | packages/core/src/types/agent-event.ts:277 |
| <a id="property-summarytokens"></a> `summaryTokens` | `readonly` | `number` | packages/core/src/types/agent-event.ts:275 |
| <a id="property-type"></a> `type` | `readonly` | `"context.compacted"` | packages/core/src/types/agent-event.ts:269 |
