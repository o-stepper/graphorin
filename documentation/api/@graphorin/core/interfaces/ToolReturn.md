[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolReturn

# Interface: ToolReturn\&lt;TOutput\&gt;

Defined in: packages/core/src/contracts/tool.ts:216

Optional return envelope: pairs a typed `output` (passed to the model)
with extra `contentParts` that are appended verbatim to the
conversation (images, files, audio, …).

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-contentparts"></a> `contentParts?` | `readonly` | readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[] | - | packages/core/src/contracts/tool.ts:218 |
| <a id="property-output"></a> `output` | `readonly` | `TOutput` | - | packages/core/src/contracts/tool.ts:217 |
| <a id="property-taint"></a> `taint?` | `readonly` | \{ `sensitive?`: `boolean`; `sourceKind?`: `string`; `untrusted?`: `boolean`; \} | C6: per-result taint override the data-flow ledger honours when recording this output. Lets a FIRST-PARTY tool whose CONTENT is not first-party (e.g. memory recall returning quarantined / foreign-provenance facts) re-arm the taint ledger, closing the cross-session poisoning leg. Flags only ever WIDEN the derived label (they cannot launder an untrusted tool's output into trusted). | packages/core/src/contracts/tool.ts:227 |
| `taint.sensitive?` | `readonly` | `boolean` | - | packages/core/src/contracts/tool.ts:229 |
| `taint.sourceKind?` | `readonly` | `string` | - | packages/core/src/contracts/tool.ts:230 |
| `taint.untrusted?` | `readonly` | `boolean` | - | packages/core/src/contracts/tool.ts:228 |
