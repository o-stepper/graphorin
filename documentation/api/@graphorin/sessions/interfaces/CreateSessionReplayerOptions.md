[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CreateSessionReplayerOptions

# Interface: CreateSessionReplayerOptions

Defined in: [packages/sessions/src/replay/replayer.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/replayer.ts#L40)

Options accepted by [createSessionReplayer](/api/@graphorin/sessions/functions/createSessionReplayer.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-audit"></a> `audit?` | `readonly` | [`ReplayAuditBridge`](/api/@graphorin/observability/interfaces/ReplayAuditBridge.md) | Audit bridge that fires once per replay invocation. | [packages/sessions/src/replay/replayer.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/replayer.ts#L44) |
| <a id="property-canreadraw"></a> `canReadRaw?` | `readonly` | (`context`) => `boolean` | Scope check invoked when the caller asks for `raw: true`. Returns `true` to allow, `false` to deny (the engine throws [ReplayAccessDeniedError](/api/@graphorin/sessions/errors/classes/ReplayAccessDeniedError.md) on `false`). | [packages/sessions/src/replay/replayer.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/replayer.ts#L52) |
| <a id="property-defaultactor"></a> `defaultActor?` | `readonly` | \{ `id`: `string`; `kind`: `"agent"` \| `"system"` \| `"token"` \| `"cli"`; \} | Default actor reported via `audit.actor` when none is supplied. | [packages/sessions/src/replay/replayer.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/replayer.ts#L46) |
| `defaultActor.id` | `readonly` | `string` | - | [packages/observability/dist/replay/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/replay/types.d.ts) |
| `defaultActor.kind` | `readonly` | `"agent"` \| `"system"` \| `"token"` \| `"cli"` | - | [packages/observability/dist/replay/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/observability/dist/replay/types.d.ts) |
| <a id="property-observability"></a> `observability?` | `readonly` | [`Replay`](/api/@graphorin/observability/interfaces/Replay.md) | Underlying observability replay primitive. | [packages/sessions/src/replay/replayer.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/replayer.ts#L42) |
