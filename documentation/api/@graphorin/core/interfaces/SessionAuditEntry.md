[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SessionAuditEntry

# Interface: SessionAuditEntry

Defined in: packages/core/src/contracts/session-store.ts:65

Session lifecycle audit event. The `@graphorin/sessions` package
appends one row per noteworthy lifecycle step (`created`, `closed`,
`forked`, `replayed`, `cassette-recorded`, `cassette-replayed`,
`commentary-sanitized`, …) plus per-session-handoff. Adapters can
surface the rows verbatim from disk.

The `metadata` field is intentionally an open record — storage
adapters serialize it as JSON. Callers should keep it small and
never include secret values.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:68 |
| <a id="property-actor"></a> `actor?` | `readonly` | \{ `id`: `string`; `kind`: `string`; `label?`: `string`; \} | packages/core/src/contracts/session-store.ts:70 |
| `actor.id` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:72 |
| `actor.kind` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:71 |
| `actor.label?` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:73 |
| <a id="property-at"></a> `at` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:69 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:66 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/core/src/contracts/session-store.ts:75 |
| <a id="property-sessionid"></a> `sessionId` | `readonly` | `string` | packages/core/src/contracts/session-store.ts:67 |
