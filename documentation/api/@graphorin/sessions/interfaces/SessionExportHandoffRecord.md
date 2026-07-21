[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportHandoffRecord

# Interface: SessionExportHandoffRecord

Defined in: packages/sessions/src/export/types.ts:145

**`Stable`**

Single handoff record. Mirrors `HandoffRecord` byte-for-byte
plus the session id.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-at"></a> `at` | `readonly` | `string` | packages/sessions/src/export/types.ts:151 |
| <a id="property-fromagentid"></a> `fromAgentId` | `readonly` | `string` | packages/sessions/src/export/types.ts:148 |
| <a id="property-inheritedsecrets"></a> `inheritedSecrets?` | `readonly` | readonly `string`[] | packages/sessions/src/export/types.ts:155 |
| <a id="property-inputfilter"></a> `inputFilter?` | `readonly` | [`HandoffInputFilterDescriptor`](/api/@graphorin/core/interfaces/HandoffInputFilterDescriptor.md) | packages/sessions/src/export/types.ts:153 |
| <a id="property-kind"></a> `kind` | `readonly` | `"handoff"` | packages/sessions/src/export/types.ts:146 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | packages/sessions/src/export/types.ts:152 |
| <a id="property-secretsinheritance"></a> `secretsInheritance?` | `readonly` | [`HandoffSecretsInheritance`](/api/@graphorin/core/type-aliases/HandoffSecretsInheritance.md) | packages/sessions/src/export/types.ts:154 |
| <a id="property-secretsoverridereason"></a> `secretsOverrideReason?` | `readonly` | `string` | packages/sessions/src/export/types.ts:156 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/sessions/src/export/types.ts:147 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | packages/sessions/src/export/types.ts:150 |
| <a id="property-toagentid"></a> `toAgentId` | `readonly` | `string` | packages/sessions/src/export/types.ts:149 |
