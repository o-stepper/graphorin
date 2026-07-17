[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportHandoffRecord

# Interface: SessionExportHandoffRecord

Defined in: [packages/sessions/src/export/types.ts:145](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L145)

Single handoff record. Mirrors `HandoffRecord` byte-for-byte
plus the session id.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-at"></a> `at` | `readonly` | `string` | [packages/sessions/src/export/types.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L151) |
| <a id="property-fromagentid"></a> `fromAgentId` | `readonly` | `string` | [packages/sessions/src/export/types.ts:148](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L148) |
| <a id="property-inheritedsecrets"></a> `inheritedSecrets?` | `readonly` | readonly `string`[] | [packages/sessions/src/export/types.ts:155](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L155) |
| <a id="property-inputfilter"></a> `inputFilter?` | `readonly` | [`HandoffInputFilterDescriptor`](/api/@graphorin/core/interfaces/HandoffInputFilterDescriptor.md) | [packages/sessions/src/export/types.ts:153](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L153) |
| <a id="property-kind"></a> `kind` | `readonly` | `"handoff"` | [packages/sessions/src/export/types.ts:146](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L146) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | [packages/sessions/src/export/types.ts:152](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L152) |
| <a id="property-secretsinheritance"></a> `secretsInheritance?` | `readonly` | [`HandoffSecretsInheritance`](/api/@graphorin/core/type-aliases/HandoffSecretsInheritance.md) | [packages/sessions/src/export/types.ts:154](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L154) |
| <a id="property-secretsoverridereason"></a> `secretsOverrideReason?` | `readonly` | `string` | [packages/sessions/src/export/types.ts:156](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L156) |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | [packages/sessions/src/export/types.ts:147](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L147) |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | [packages/sessions/src/export/types.ts:150](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L150) |
| <a id="property-toagentid"></a> `toAgentId` | `readonly` | `string` | [packages/sessions/src/export/types.ts:149](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L149) |
