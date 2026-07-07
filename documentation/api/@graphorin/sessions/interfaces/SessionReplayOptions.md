[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionReplayOptions

# Interface: SessionReplayOptions

Defined in: [packages/sessions/src/replay/types.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L36)

Options accepted by `Session.replay({...})`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-actor"></a> `actor?` | `readonly` | [`ReplayActor`](/api/@graphorin/sessions/interfaces/ReplayActor.md) | Override the actor on the audit row. | [packages/sessions/src/replay/types.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L48) |
| <a id="property-cassette"></a> `cassette?` | `readonly` | [`ToolCassetteSource`](/api/@graphorin/sessions/type-aliases/ToolCassetteSource.md) | Optional cassette to apply substitution-vs-live tool decisions over. When supplied, the replay engine emits `tool.cassette.replay.*` events alongside the trace replay. | [packages/sessions/src/replay/types.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L54) |
| <a id="property-failonidempotencymismatch"></a> `failOnIdempotencyMismatch?` | `readonly` | `boolean` | Default `false`. | [packages/sessions/src/replay/types.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L60) |
| <a id="property-failonschemamismatch"></a> `failOnSchemaMismatch?` | `readonly` | `boolean` | Default `true` (silent schema drift is a debugging black hole). | [packages/sessions/src/replay/types.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L62) |
| <a id="property-frommessageid"></a> `fromMessageId?` | `readonly` | `string` | Restrict the replay to spans newer than this id. | [packages/sessions/src/replay/types.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L44) |
| <a id="property-minsensitivity"></a> `minSensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | Default `'public'` (library mode safe default). | [packages/sessions/src/replay/types.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L46) |
| <a id="property-onmissingartifact"></a> `onMissingArtifact?` | `readonly` | `"fallback-live"` \| `"abort"` | Default `'abort'`. | [packages/sessions/src/replay/types.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L64) |
| <a id="property-pertoolmode"></a> `perToolMode?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `"live"` \| `"recorded"`\&gt;\> | Per-tool overrides honoured under `toolReplayMode: 'mixed'`. | [packages/sessions/src/replay/types.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L58) |
| <a id="property-raw"></a> `raw?` | `readonly` | `boolean` | Default `false`. When `true`, the configured `canReadRaw` predicate must return `true` AND the audit row records a raw access entry. | [packages/sessions/src/replay/types.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L42) |
| <a id="property-toolreplaymode"></a> `toolReplayMode?` | `readonly` | [`ToolReplayMode`](/api/@graphorin/sessions/type-aliases/ToolReplayMode.md) | Default `'auto'` when `cassette` is supplied; ignored otherwise. | [packages/sessions/src/replay/types.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L56) |
