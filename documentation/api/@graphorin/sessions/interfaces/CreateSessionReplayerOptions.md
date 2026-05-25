[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CreateSessionReplayerOptions

# Interface: CreateSessionReplayerOptions

Defined in: packages/sessions/src/replay/replayer.ts:39

Options accepted by [createSessionReplayer](/api/@graphorin/sessions/functions/createSessionReplayer.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-audit"></a> `audit?` | `readonly` | [`ReplayAuditBridge`](/api/@graphorin/observability/interfaces/ReplayAuditBridge.md) | Audit bridge that fires once per replay invocation. | packages/sessions/src/replay/replayer.ts:43 |
| <a id="property-canreadraw"></a> `canReadRaw?` | `readonly` | (`context`) => `boolean` | Scope check invoked when the caller asks for `raw: true`. Returns `true` to allow, `false` to deny (the engine throws [ReplayAccessDeniedError](/api/@graphorin/sessions/errors/classes/ReplayAccessDeniedError.md) on `false`). | packages/sessions/src/replay/replayer.ts:51 |
| <a id="property-defaultactor"></a> `defaultActor?` | `readonly` | \{ `id`: `string`; `kind`: `"agent"` \| `"system"` \| `"token"` \| `"cli"`; \} | Default actor reported via `audit.actor` when none is supplied. | packages/sessions/src/replay/replayer.ts:45 |
| `defaultActor.id` | `readonly` | `string` | - | packages/observability/dist/replay/types.d.ts:37 |
| `defaultActor.kind` | `readonly` | `"agent"` \| `"system"` \| `"token"` \| `"cli"` | - | packages/observability/dist/replay/types.d.ts:36 |
| <a id="property-observability"></a> `observability?` | `readonly` | [`Replay`](/api/@graphorin/observability/interfaces/Replay.md) | Underlying observability replay primitive. | packages/sessions/src/replay/replayer.ts:41 |
