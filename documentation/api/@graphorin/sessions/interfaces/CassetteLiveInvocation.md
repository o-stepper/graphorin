[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CassetteLiveInvocation

# Interface: CassetteLiveInvocation

Defined in: [packages/sessions/src/cassette/replay.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/replay.ts#L85)

Live invocation surface threaded into `decideToolReplay(...)` by
the agent runtime at the moment of tool dispatch.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | - | [packages/sessions/src/cassette/replay.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/replay.ts#L87) |
| <a id="property-idempotencykey"></a> `idempotencyKey?` | `readonly` | `string` | Resolved live `idempotencyKey(input, ctx)` output, if the tool declares the optional callback. `undefined` means the tool does not declare one. | [packages/sessions/src/cassette/replay.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/replay.ts#L93) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | [packages/sessions/src/cassette/replay.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/replay.ts#L86) |
| <a id="property-validaterecordedoutput"></a> `validateRecordedOutput?` | `public` | (`output`) => `string` \| `null` | Validate the cassette's recorded `output` against the live tool's `outputSchema`. Returning a non-empty issues string signals a schema drift; the engine surfaces a [CassetteSchemaMismatchError](/api/@graphorin/sessions/errors/classes/CassetteSchemaMismatchError.md) when `failOnSchemaMismatch` is `true`. | [packages/sessions/src/cassette/replay.ts:101](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/replay.ts#L101) |
