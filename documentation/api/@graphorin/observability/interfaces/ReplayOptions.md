[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / ReplayOptions

# Interface: ReplayOptions

Defined in: packages/observability/src/replay/types.ts:84

**`Stable`**

Configuration shape for [createReplay](/api/@graphorin/observability/functions/createReplay.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-audit"></a> `audit?` | `readonly` | [`ReplayAuditBridge`](/api/@graphorin/observability/interfaces/ReplayAuditBridge.md) | Optional audit bridge - called once per replay invocation. | packages/observability/src/replay/types.ts:88 |
| <a id="property-canreadraw"></a> `canReadRaw?` | `readonly` | (`context`) => `boolean` | Scope check invoked when the caller asks for `mode: 'raw'`. Returns `true` to allow, `false` to deny. The server (Phase 14) wires this to the `traces:read:raw` token scope; in library mode it defaults to `() => true` (operators trust their own process). | packages/observability/src/replay/types.ts:97 |
| <a id="property-defaultactor"></a> `defaultActor?` | `readonly` | \{ `id`: `string`; `kind`: `"agent"` \| `"system"` \| `"token"` \| `"cli"`; \} | Default actor reported via `audit.actor` when none is supplied. | packages/observability/src/replay/types.ts:90 |
| `defaultActor.id` | `readonly` | `string` | - | packages/observability/src/replay/types.ts:42 |
| `defaultActor.kind` | `readonly` | `"agent"` \| `"system"` \| `"token"` \| `"cli"` | - | packages/observability/src/replay/types.ts:42 |
| <a id="property-validator"></a> `validator?` | `readonly` | [`RedactionValidatorInstance`](/api/@graphorin/observability/interfaces/RedactionValidatorInstance.md) | Validator used to sanitize records when `mode === 'sanitized'`. | packages/observability/src/replay/types.ts:86 |
