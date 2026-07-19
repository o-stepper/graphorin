[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolReturn

# Interface: ToolReturn\&lt;TOutput\&gt;

Defined in: packages/core/src/contracts/tool.ts:242

**`Stable`**

Optional return envelope: pairs a typed `output` (passed to the model)
with extra `contentParts` that are appended verbatim to the
conversation (images, files, audio, …).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-tool_return_brand"></a> `[TOOL_RETURN_BRAND]?` | `readonly` | `true` | W-115: envelope brand set by the [toolReturn](/api/@graphorin/core/functions/toolReturn.md) factory. `Symbol.for`, so duplicate package copies agree. Prefer branding: the structural fallback in the executor is deliberately narrow (own keys within `{output, contentParts, taint}`), and plain data that happens to be exactly `{ output: X }` is ambiguous by construction - brand it (or rename the field) to disambiguate. | packages/core/src/contracts/tool.ts:251 |
| <a id="property-contentparts"></a> `contentParts?` | `readonly` | readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[] | - | packages/core/src/contracts/tool.ts:253 |
| <a id="property-output"></a> `output` | `readonly` | `TOutput` | - | packages/core/src/contracts/tool.ts:252 |
| <a id="property-taint"></a> `taint?` | `readonly` | \{ `sensitive?`: `boolean`; `sourceKind?`: `string`; `untrusted?`: `boolean`; \} | C6: per-result taint override the data-flow ledger honours when recording this output. Lets a FIRST-PARTY tool whose CONTENT is not first-party (e.g. memory recall returning quarantined / foreign-provenance facts) re-arm the taint ledger, closing the cross-session poisoning leg. Flags only ever WIDEN the derived label (they cannot launder an untrusted tool's output into trusted). | packages/core/src/contracts/tool.ts:262 |
| `taint.sensitive?` | `readonly` | `boolean` | - | packages/core/src/contracts/tool.ts:264 |
| `taint.sourceKind?` | `readonly` | `string` | - | packages/core/src/contracts/tool.ts:265 |
| `taint.untrusted?` | `readonly` | `boolean` | - | packages/core/src/contracts/tool.ts:263 |
