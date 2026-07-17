[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ResultHandle

# Interface: ResultHandle

Defined in: [packages/core/src/types/tool.ts:194](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L194)

An opaque, run-scoped reference to a large tool result that was stored
out of the conversation buffer rather than inlined in full. The agent
inlines [preview](/api/@graphorin/core/interfaces/ResultHandle.md#property-preview) (plus a retrieval hint) and registers the
built-in `read_result` tool so the model can page through the full
artifact behind [uri](/api/@graphorin/core/interfaces/ResultHandle.md#property-uri) on demand - keeping large results out of the
context window (P1-4).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-bytes"></a> `bytes?` | `readonly` | `number` | Total byte size of the full stored artifact, when known. | [packages/core/src/types/tool.ts:207](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L207) |
| <a id="property-kind"></a> `kind` | `readonly` | `"spill-file"` \| `"resource-link"` | Backing store kind. `'spill-file'` today; `'resource-link'` is reserved for MCP (WI-13). | [packages/core/src/types/tool.ts:203](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L203) |
| <a id="property-mediatype"></a> `mediaType?` | `readonly` | `string` | MIME type of the stored artifact, when known. | [packages/core/src/types/tool.ts:209](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L209) |
| <a id="property-preview"></a> `preview` | `readonly` | `string` | A bounded preview of the full body (already inlined alongside the handle). | [packages/core/src/types/tool.ts:205](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L205) |
| <a id="property-producertrustclass"></a> `producerTrustClass?` | `readonly` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | Trust class of the tool that PRODUCED the stored body (TL-6). `read_result` re-applies inbound sanitization and dataflow provenance by this class, so an untrusted spill cannot launder to trusted through the built-in reader. | [packages/core/src/types/tool.ts:216](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L216) |
| <a id="property-uri"></a> `uri` | `readonly` | `string` | Opaque, run-scoped URI - e.g. `graphorin-spill:<runId>/<toolCallId>.json` for a spill artifact. Never a raw filesystem path: the reader resolves it within the configured artifact root, so the model cannot use it to read arbitrary files. | [packages/core/src/types/tool.ts:201](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L201) |
