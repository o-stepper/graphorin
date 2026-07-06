[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / TaintLabel

# Interface: TaintLabel

Defined in: [packages/security/src/dataflow/types.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L69)

Provenance label derived from a tool's registration metadata. Describes
whether the tool's *output* should be treated as untrusted and/or
sensitive for the purposes of downstream sink checks.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-sensitive"></a> `sensitive` | `readonly` | `boolean` | `true` when the output carries secret-tier data (`sensitivity: 'secret'`). Only the `'secret'` tier counts: `'internal'` is the default for ordinary user content, so treating it as sensitive would make the trifecta gate fire on virtually every run. | [packages/security/src/dataflow/types.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L93) |
| <a id="property-sensitivity"></a> `sensitivity` | `readonly` | \| `"unknown"` \| [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | The producing tool's declared sensitivity (`'unknown'` when absent). | [packages/security/src/dataflow/types.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L80) |
| <a id="property-sourcekind"></a> `sourceKind` | `readonly` | `string` | The producing tool's source kind (`'unknown'` when unattributed). Typically a `ToolSource['kind']`; C6 widens the type to `string` so derived labels can carry descriptive kinds (`'llm-derived'`, `'memory-recall'`, `'resumed-untrusted'`). | [packages/security/src/dataflow/types.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L78) |
| <a id="property-trustclass"></a> `trustClass` | `readonly` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | Resolved trust class of the producing tool. | [packages/security/src/dataflow/types.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L71) |
| <a id="property-untrusted"></a> `untrusted` | `readonly` | `boolean` | `true` when the output originates from an untrusted source (`mcp-derived`, `web-search`, `skill-untrusted`) - content a prompt injection could be hidden in. | [packages/security/src/dataflow/types.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/dataflow/types.ts#L86) |
