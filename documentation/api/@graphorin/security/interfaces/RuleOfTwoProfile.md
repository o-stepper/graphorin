[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / RuleOfTwoProfile

# Interface: RuleOfTwoProfile

Defined in: [packages/security/src/policy/tool-argument-policy.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L129)

Capability profile for the Rule-of-Two preset. Declares which of the
three trifecta legs the agent is permitted to hold this session. The
dangerous configuration is holding all three; a well-formed profile
drops at least one.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-externalsideeffects"></a> `externalSideEffects` | `readonly` | `boolean` | May the agent take external side effects (write / send / deploy)? | [packages/security/src/policy/tool-argument-policy.ts:135](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L135) |
| <a id="property-sensitivedata"></a> `sensitiveData` | `readonly` | `boolean` | May the agent read sensitive data (secrets / PII)? | [packages/security/src/policy/tool-argument-policy.ts:133](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L133) |
| <a id="property-untrustedinput"></a> `untrustedInput` | `readonly` | `boolean` | May the agent ingest untrusted input (web / MCP / untrusted skills)? | [packages/security/src/policy/tool-argument-policy.ts:131](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/policy/tool-argument-policy.ts#L131) |
