[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / GuardrailContext

# Interface: GuardrailContext

Defined in: [packages/security/src/guardrails/types.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/types.ts#L44)

Per-call context handed to every guardrail. The runtime injects
the structured logger, optional locale hint, and any additional
fields a guardrail may want to read. The shape is intentionally
tiny so guardrails are easy to test without booting the full
runtime.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | - | [packages/security/src/guardrails/types.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/types.ts#L50) |
| <a id="property-locale"></a> `locale?` | `readonly` | `string` | Locale hint used by language-aware guardrails. | [packages/security/src/guardrails/types.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/types.ts#L52) |
| <a id="property-runid"></a> `runId?` | `readonly` | `string` | Optional run / session bookkeeping. | [packages/security/src/guardrails/types.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/types.ts#L48) |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | - | [packages/security/src/guardrails/types.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/types.ts#L49) |
| <a id="property-stage"></a> `stage` | `readonly` | [`GuardrailStage`](/api/@graphorin/security/type-aliases/GuardrailStage.md) | Stage at which the guardrail is running. | [packages/security/src/guardrails/types.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/types.ts#L46) |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | Optional logger handle. | [packages/security/src/guardrails/types.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/types.ts#L54) |
