[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CassetteReplayPolicyOptions

# Interface: CassetteReplayPolicyOptions

Defined in: [packages/sessions/src/cassette/replay.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/replay.ts#L109)

Configuration consumed by [decideToolReplay](/api/@graphorin/sessions/functions/decideToolReplay.md).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-failonidempotencymismatch"></a> `failOnIdempotencyMismatch?` | `readonly` | `boolean` | [packages/sessions/src/cassette/replay.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/replay.ts#L112) |
| <a id="property-failonschemamismatch"></a> `failOnSchemaMismatch?` | `readonly` | `boolean` | [packages/sessions/src/cassette/replay.ts:113](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/replay.ts#L113) |
| <a id="property-mode"></a> `mode` | `readonly` | `"auto"` \| `"live"` \| `"recorded"` \| `"mixed"` | [packages/sessions/src/cassette/replay.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/replay.ts#L110) |
| <a id="property-pertoolmode"></a> `perToolMode?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `"live"` \| `"recorded"`\&gt;\> | [packages/sessions/src/cassette/replay.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/replay.ts#L111) |
