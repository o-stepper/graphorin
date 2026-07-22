[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / SanitizationOutcome

# Interface: SanitizationOutcome

Defined in: packages/tools/src/inbound/sanitize.ts:41

**`Stable`**

Outcome of [applyInboundSanitization](/api/@graphorin/tools/functions/applyInboundSanitization.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-blocked"></a> `blocked` | `readonly` | `boolean` | Set when `failClosed: true` and at least one pattern fired. The executor surfaces this as `ToolError({ kind: 'inbound_sanitization_blocked' })`. | packages/tools/src/inbound/sanitize.ts:67 |
| <a id="property-body"></a> `body` | `readonly` | `string` | Final body that flows downstream. | packages/tools/src/inbound/sanitize.ts:43 |
| <a id="property-bytesstripped"></a> `bytesStripped` | `readonly` | `number` | Net bytes removed by the strip pass (always `>= 0`). Redaction replaces each match with a mask, so this is `max(0, before - after)` - it is `0` when the masks are at least as long as the text they covered even though matches were stripped (see `stripped` / `patternsHit`). | packages/tools/src/inbound/sanitize.ts:58 |
| <a id="property-modified"></a> `modified` | `readonly` | `boolean` | Whether the body was modified relative to the input. | packages/tools/src/inbound/sanitize.ts:45 |
| <a id="property-patternshit"></a> `patternsHit` | `readonly` | readonly `string`[] | Pattern names that fired during the scan. | packages/tools/src/inbound/sanitize.ts:47 |
| <a id="property-scandurationus"></a> `scanDurationUs` | `readonly` | `number` | Time spent on the scan in microseconds. | packages/tools/src/inbound/sanitize.ts:60 |
| <a id="property-scantimedout"></a> `scanTimedOut` | `readonly` | `boolean` | Whether the scan timed out (best-effort fallthrough). | packages/tools/src/inbound/sanitize.ts:62 |
| <a id="property-stripped"></a> `stripped` | `readonly` | `boolean` | Whether matches were stripped. | packages/tools/src/inbound/sanitize.ts:51 |
| <a id="property-wrapped"></a> `wrapped` | `readonly` | `boolean` | Whether the body is wrapped in the untrusted-content envelope. | packages/tools/src/inbound/sanitize.ts:49 |
