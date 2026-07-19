[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / GuardrailTrippedEvent

# Interface: GuardrailTrippedEvent

Defined in: packages/core/src/types/agent-event.ts:297

**`Stable`**

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-guardrailname"></a> `guardrailName` | `readonly` | `string` | packages/core/src/types/agent-event.ts:299 |
| <a id="property-phase"></a> `phase` | `readonly` | `"output"` \| `"input"` | packages/core/src/types/agent-event.ts:300 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | packages/core/src/types/agent-event.ts:301 |
| <a id="property-type"></a> `type` | `readonly` | `"guardrail.tripped"` | packages/core/src/types/agent-event.ts:298 |
