[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / ReplayRunInput

# Interface: ReplayRunInput

Defined in: [packages/observability/src/replay/types.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/replay/types.ts#L105)

Per-call options consumed by `Replay.run(...)`.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-actor"></a> `actor?` | `readonly` | \{ `id`: `string`; `kind`: `"agent"` \| `"system"` \| `"token"` \| `"cli"`; \} | [packages/observability/src/replay/types.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/replay/types.ts#L111) |
| `actor.id` | `readonly` | `string` | [packages/observability/src/replay/types.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/replay/types.ts#L42) |
| `actor.kind` | `readonly` | `"agent"` \| `"system"` \| `"token"` \| `"cli"` | [packages/observability/src/replay/types.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/replay/types.ts#L42) |
| <a id="property-fromspanid"></a> `fromSpanId?` | `readonly` | `string` | [packages/observability/src/replay/types.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/replay/types.ts#L110) |
| <a id="property-minsensitivity"></a> `minSensitivity?` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | [packages/observability/src/replay/types.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/replay/types.ts#L109) |
| <a id="property-mode"></a> `mode?` | `readonly` | [`ReplayMode`](/api/@graphorin/observability/type-aliases/ReplayMode.md) | [packages/observability/src/replay/types.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/replay/types.ts#L108) |
| <a id="property-source"></a> `source` | `readonly` | \| `AsyncIterable`\<[`SpanRecord`](/api/@graphorin/observability/interfaces/SpanRecord.md)\&lt;[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\&gt;, `any`, `any`\> \| `Iterable`\<[`SpanRecord`](/api/@graphorin/observability/interfaces/SpanRecord.md)\&lt;[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\&gt;, `any`, `any`\> | [packages/observability/src/replay/types.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/replay/types.ts#L106) |
| <a id="property-target"></a> `target` | `readonly` | `string` | [packages/observability/src/replay/types.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/replay/types.ts#L107) |
