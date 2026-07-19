[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolCallRecord

# Interface: ToolCallRecord

Defined in: packages/sessions/src/cassette/types.ts:81

**`Stable`**

Per-`Tool.execute(...)` invocation. The canonical record kind that
the `ToolCassetteReplayPolicy` consumes during replay.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId` | `readonly` | `string` | - | packages/sessions/src/cassette/types.ts:92 |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | - | packages/sessions/src/cassette/types.ts:88 |
| <a id="property-contentparts"></a> `contentParts?` | `readonly` | readonly [`MessageContent`](/api/@graphorin/sessions/facade/type-aliases/MessageContent.md)[] | Optional in-line `MessageContent` parts. When the cassette is written with `includeArtifacts: false`, only `contentPartsRefs` is populated; when `true`, the parts are also surfaced inline for self-contained replay. | packages/sessions/src/cassette/types.ts:107 |
| <a id="property-contentpartsrefs"></a> `contentPartsRefs?` | `readonly` | readonly \{ `kind`: `"image"` \| `"file"` \| `"audio"` \| `"resource-link"`; `path`: `string`; `sizeBytes`: `number`; \}[] | - | packages/sessions/src/cassette/types.ts:96 |
| <a id="property-durationms"></a> `durationMs` | `readonly` | `number` | - | packages/sessions/src/cassette/types.ts:91 |
| <a id="property-idempotencykey"></a> `idempotencyKey?` | `readonly` | `string` | - | packages/sessions/src/cassette/types.ts:87 |
| <a id="property-kind"></a> `kind` | `readonly` | `"tool-call"` | - | packages/sessions/src/cassette/types.ts:82 |
| <a id="property-output"></a> `output` | `readonly` | `unknown` | - | packages/sessions/src/cassette/types.ts:89 |
| <a id="property-sha256ofargs"></a> `sha256OfArgs?` | `readonly` | `string` | - | packages/sessions/src/cassette/types.ts:94 |
| <a id="property-sha256ofoutput"></a> `sha256OfOutput?` | `readonly` | `string` | - | packages/sessions/src/cassette/types.ts:95 |
| <a id="property-sideeffectclass"></a> `sideEffectClass` | `readonly` | [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md) | - | packages/sessions/src/cassette/types.ts:86 |
| <a id="property-status"></a> `status` | `readonly` | [`ToolCallRecordStatus`](/api/@graphorin/sessions/type-aliases/ToolCallRecordStatus.md) | - | packages/sessions/src/cassette/types.ts:90 |
| <a id="property-stepnumber"></a> `stepNumber` | `readonly` | `number` | - | packages/sessions/src/cassette/types.ts:83 |
| <a id="property-timestampiso"></a> `timestampIso` | `readonly` | `string` | - | packages/sessions/src/cassette/types.ts:93 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | packages/sessions/src/cassette/types.ts:84 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | packages/sessions/src/cassette/types.ts:85 |
