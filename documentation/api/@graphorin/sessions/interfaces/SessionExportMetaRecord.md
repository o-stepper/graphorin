[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportMetaRecord

# Interface: SessionExportMetaRecord

Defined in: [packages/sessions/src/export/types.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L64)

Sentinel header (always line 1).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-counts"></a> `counts?` | `readonly` | \{ `agentCount?`: `number`; `handoffCount?`: `number`; `messageCount?`: `number`; \} | - | [packages/sessions/src/export/types.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L77) |
| `counts.agentCount?` | `readonly` | `number` | - | [packages/sessions/src/export/types.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L79) |
| `counts.handoffCount?` | `readonly` | `number` | - | [packages/sessions/src/export/types.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L80) |
| `counts.messageCount?` | `readonly` | `number` | - | [packages/sessions/src/export/types.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L78) |
| <a id="property-createdat"></a> `createdAt` | `readonly` | `string` | - | [packages/sessions/src/export/types.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L68) |
| <a id="property-embedderids"></a> `embedderIds?` | `readonly` | readonly `string`[] | Active embedder identifiers at write time. Used by the importer to drop embeddings under embedder mismatch. | [packages/sessions/src/export/types.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L76) |
| <a id="property-format"></a> `format` | `readonly` | `"graphorin-session-export"` | - | [packages/sessions/src/export/types.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L67) |
| <a id="property-kind"></a> `kind` | `readonly` | `"meta"` | - | [packages/sessions/src/export/types.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L65) |
| <a id="property-minruntimeversion"></a> `minRuntimeVersion` | `readonly` | `string` | - | [packages/sessions/src/export/types.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L70) |
| <a id="property-schemaurl"></a> `schemaUrl?` | `readonly` | `string` | - | [packages/sessions/src/export/types.ts:71](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L71) |
| <a id="property-version"></a> `version` | `readonly` | `string` | - | [packages/sessions/src/export/types.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L66) |
| <a id="property-writer"></a> `writer` | `readonly` | `string` | - | [packages/sessions/src/export/types.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/export/types.ts#L69) |
