[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [audit](/api/@graphorin/tools/audit/index.md) / ToolAuditEvent

# Interface: ToolAuditEvent

Defined in: [packages/tools/src/audit/index.ts:103](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L103)

Sanitized payload emitted by the tool subsystem. Listeners receive
only metadata that is safe to log - the actual tool args, the
matched bytes, the secret values are NEVER forwarded.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | [`ToolAuditAction`](/api/@graphorin/tools/audit/type-aliases/ToolAuditAction.md) | [packages/tools/src/audit/index.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L104) |
| <a id="property-actor"></a> `actor` | `readonly` | [`ToolAuditActor`](/api/@graphorin/tools/audit/interfaces/ToolAuditActor.md) | [packages/tools/src/audit/index.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L105) |
| <a id="property-context"></a> `context?` | `readonly` | \{ `runId?`: `string`; `sessionId?`: `string`; `stepNumber?`: `number`; `toolCallId?`: `string`; \} | [packages/tools/src/audit/index.ts:109](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L109) |
| `context.runId?` | `readonly` | `string` | [packages/tools/src/audit/index.ts:110](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L110) |
| `context.sessionId?` | `readonly` | `string` | [packages/tools/src/audit/index.ts:111](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L111) |
| `context.stepNumber?` | `readonly` | `number` | [packages/tools/src/audit/index.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L112) |
| `context.toolCallId?` | `readonly` | `string` | [packages/tools/src/audit/index.ts:113](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L113) |
| <a id="property-decision"></a> `decision` | `readonly` | [`ToolAuditDecision`](/api/@graphorin/tools/audit/type-aliases/ToolAuditDecision.md) | [packages/tools/src/audit/index.ts:107](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L107) |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | [packages/tools/src/audit/index.ts:115](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L115) |
| <a id="property-target"></a> `target` | `readonly` | `string` | [packages/tools/src/audit/index.ts:106](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L106) |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | [packages/tools/src/audit/index.ts:108](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/audit/index.ts#L108) |
