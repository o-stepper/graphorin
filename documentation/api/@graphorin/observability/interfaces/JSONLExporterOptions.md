[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / JSONLExporterOptions

# Interface: JSONLExporterOptions

Defined in: packages/observability/src/exporters/jsonl.ts:31

**`Stable`**

Configuration shape for [createJSONLExporter](/api/@graphorin/observability/functions/createJSONLExporter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id?` | `readonly` | `string` | Identifier reported via `exporter.id`. Defaults to `'jsonl'`. | packages/observability/src/exporters/jsonl.ts:33 |
| <a id="property-maxopenhandles"></a> `maxOpenHandles?` | `readonly` | `number` | Upper bound on simultaneously-open file handles. The pool keys by `(session, UTC-month)`, so a long-living server would otherwise hold one fd per pair forever; the least-recently-used handle is closed once the cap is reached. Defaults to `64`. | packages/observability/src/exporters/jsonl.ts:56 |
| <a id="property-now"></a> `now?` | `readonly` | [`DateProvider`](/api/@graphorin/observability/type-aliases/DateProvider.md) | **`Internal`** Override the date used when picking the rotation directory. Defaults to `() => new Date()`. | packages/observability/src/exporters/jsonl.ts:49 |
| <a id="property-path"></a> `path` | `readonly` | `string` | Root directory for the trace files. Created if missing. | packages/observability/src/exporters/jsonl.ts:35 |
| <a id="property-resolvefilepath"></a> `resolveFilePath?` | `readonly` | (`record`, `root`) => `string` | Resolver that picks the file path for a given span record. Defaults to `<rootPath>/<YYYY-MM>/<sessionId>.jsonl` keyed off the `graphorin.session.id` attribute (or `unsessioned.jsonl` when absent). | packages/observability/src/exporters/jsonl.ts:42 |
