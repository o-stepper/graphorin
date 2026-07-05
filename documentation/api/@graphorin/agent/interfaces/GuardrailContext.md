[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / GuardrailContext

# Interface: GuardrailContext

Defined in: packages/security/dist/guardrails/types.d.ts:42

Per-call context handed to every guardrail. The runtime injects
the structured logger, optional locale hint, and any additional
fields a guardrail may want to read. The shape is intentionally
tiny so guardrails are easy to test without booting the full
runtime.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | - | packages/security/dist/guardrails/types.d.ts:48 |
| <a id="property-locale"></a> `locale?` | `readonly` | `string` | Locale hint used by language-aware guardrails. | packages/security/dist/guardrails/types.d.ts:50 |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | Optional run / session bookkeeping. | packages/security/dist/guardrails/types.d.ts:46 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | packages/security/dist/guardrails/types.d.ts:47 |
| <a id="property-stage"></a> `stage` | `readonly` | [`GuardrailStage`](/api/@graphorin/security/type-aliases/GuardrailStage.md) | Stage at which the guardrail is running. | packages/security/dist/guardrails/types.d.ts:44 |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | Optional logger handle. | packages/security/dist/guardrails/types.d.ts:52 |
