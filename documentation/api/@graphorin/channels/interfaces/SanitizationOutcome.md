[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / SanitizationOutcome

# Interface: SanitizationOutcome

Defined in: [packages/tools/dist/inbound/sanitize.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/inbound/sanitize.d.ts)

**`Stable`**

Outcome of [applyInboundSanitization](/api/@graphorin/tools/functions/applyInboundSanitization.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-blocked"></a> `blocked` | `readonly` | `boolean` | Set when `failClosed: true` and at least one pattern fired. The executor surfaces this as `ToolError({ kind: 'inbound_sanitization_blocked' })`. | [packages/tools/dist/inbound/sanitize.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/inbound/sanitize.d.ts) |
| <a id="property-body"></a> `body` | `readonly` | `string` | Final body that flows downstream. | [packages/tools/dist/inbound/sanitize.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/inbound/sanitize.d.ts) |
| <a id="property-bytesstripped"></a> `bytesStripped` | `readonly` | `number` | Net bytes removed by the strip pass (always `>= 0`). Redaction replaces each match with a mask, so this is `max(0, before - after)` - it is `0` when the masks are at least as long as the text they covered even though matches were stripped (see `stripped` / `patternsHit`). | [packages/tools/dist/inbound/sanitize.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/inbound/sanitize.d.ts) |
| <a id="property-modified"></a> `modified` | `readonly` | `boolean` | Whether the body was modified relative to the input. | [packages/tools/dist/inbound/sanitize.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/inbound/sanitize.d.ts) |
| <a id="property-patternshit"></a> `patternsHit` | `readonly` | readonly `string`[] | Pattern names that fired during the scan. | [packages/tools/dist/inbound/sanitize.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/inbound/sanitize.d.ts) |
| <a id="property-scandurationus"></a> `scanDurationUs` | `readonly` | `number` | Time spent on the scan in microseconds. | [packages/tools/dist/inbound/sanitize.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/inbound/sanitize.d.ts) |
| <a id="property-scantimedout"></a> `scanTimedOut` | `readonly` | `boolean` | Whether the scan timed out (best-effort fallthrough). | [packages/tools/dist/inbound/sanitize.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/inbound/sanitize.d.ts) |
| <a id="property-stripped"></a> `stripped` | `readonly` | `boolean` | Whether matches were stripped. | [packages/tools/dist/inbound/sanitize.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/inbound/sanitize.d.ts) |
| <a id="property-wrapped"></a> `wrapped` | `readonly` | `boolean` | Whether the body is wrapped in the untrusted-content envelope. | [packages/tools/dist/inbound/sanitize.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/tools/dist/inbound/sanitize.d.ts) |
