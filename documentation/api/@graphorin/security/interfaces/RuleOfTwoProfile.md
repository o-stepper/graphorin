[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / RuleOfTwoProfile

# Interface: RuleOfTwoProfile

Defined in: packages/security/src/policy/tool-argument-policy.ts:249

**`Stable`**

Capability profile for the Rule-of-Two preset. Declares which of the
three trifecta legs the agent is permitted to hold this session. The
dangerous configuration is holding all three; a well-formed profile
drops at least one.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-externalsideeffects"></a> `externalSideEffects` | `readonly` | `boolean` | May the agent take external side effects (write / send / deploy)? | packages/security/src/policy/tool-argument-policy.ts:255 |
| <a id="property-sensitivedata"></a> `sensitiveData` | `readonly` | `boolean` | May the agent read sensitive data (secrets / PII)? | packages/security/src/policy/tool-argument-policy.ts:253 |
| <a id="property-untrustedinput"></a> `untrustedInput` | `readonly` | `boolean` | May the agent ingest untrusted input (web / MCP / untrusted skills)? | packages/security/src/policy/tool-argument-policy.ts:251 |
