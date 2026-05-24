[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / HandoffRecord

# Interface: HandoffRecord

Defined in: packages/core/src/types/handoff.ts:82

Recorded handoff event captured on `RunState.handoffs` and replayed by
the JSONL session export. The shape is wire-stable.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-at"></a> `at` | `readonly` | `string` | - | packages/core/src/types/handoff.ts:86 |
| <a id="property-fromagentid"></a> `fromAgentId` | `readonly` | `string` | - | packages/core/src/types/handoff.ts:83 |
| <a id="property-inheritedsecrets"></a> `inheritedSecrets?` | `readonly` | readonly `string`[] | Keys inherited by the sub-agent under the `'inherit-allowlist'` / `'forward-explicit'` policies. Never the secret values themselves — only the public key names. | packages/core/src/types/handoff.ts:105 |
| <a id="property-inputfilter"></a> `inputFilter?` | `readonly` | [`HandoffInputFilterDescriptor`](/api/@graphorin/core/interfaces/HandoffInputFilterDescriptor.md) | Serializable input-filter descriptor applied at handoff time. When undefined the runtime defaults applied (commonly `compose(lastN(10), stripReasoning, stripSensitiveOutputs)`); the concrete filter implementations live in `@graphorin/agent`. | packages/core/src/types/handoff.ts:94 |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | - | packages/core/src/types/handoff.ts:87 |
| <a id="property-secretsinheritance"></a> `secretsInheritance?` | `readonly` | [`HandoffSecretsInheritance`](/api/@graphorin/core/type-aliases/HandoffSecretsInheritance.md) | Sub-agent secrets propagation policy. Defaults to `'inherit-allowlist'` with empty `inheritedSecrets`. | packages/core/src/types/handoff.ts:99 |
| <a id="property-secretsoverridereason"></a> `secretsOverrideReason?` | `readonly` | `string` | Operator-supplied justification for broadening or narrowing the default secrets surface. Surfaced in audit logs. | packages/core/src/types/handoff.ts:110 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | packages/core/src/types/handoff.ts:85 |
| <a id="property-toagentid"></a> `toAgentId` | `readonly` | `string` | - | packages/core/src/types/handoff.ts:84 |
