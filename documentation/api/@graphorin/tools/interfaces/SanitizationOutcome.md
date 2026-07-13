[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / SanitizationOutcome

# Interface: SanitizationOutcome

Defined in: [packages/tools/src/inbound/sanitize.ts:41](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L41)

Outcome of [applyInboundSanitization](/api/@graphorin/tools/functions/applyInboundSanitization.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-blocked"></a> `blocked` | `readonly` | `boolean` | Set when `failClosed: true` and at least one pattern fired. The executor surfaces this as `ToolError({ kind: 'inbound_sanitization_blocked' })`. | [packages/tools/src/inbound/sanitize.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L62) |
| <a id="property-body"></a> `body` | `readonly` | `string` | Final body that flows downstream. | [packages/tools/src/inbound/sanitize.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L43) |
| <a id="property-bytesstripped"></a> `bytesStripped` | `readonly` | `number` | Bytes removed by the strip pass. | [packages/tools/src/inbound/sanitize.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L53) |
| <a id="property-modified"></a> `modified` | `readonly` | `boolean` | Whether the body was modified relative to the input. | [packages/tools/src/inbound/sanitize.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L45) |
| <a id="property-patternshit"></a> `patternsHit` | `readonly` | readonly `string`[] | Pattern names that fired during the scan. | [packages/tools/src/inbound/sanitize.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L47) |
| <a id="property-scandurationus"></a> `scanDurationUs` | `readonly` | `number` | Time spent on the scan in microseconds. | [packages/tools/src/inbound/sanitize.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L55) |
| <a id="property-scantimedout"></a> `scanTimedOut` | `readonly` | `boolean` | Whether the scan timed out (best-effort fallthrough). | [packages/tools/src/inbound/sanitize.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L57) |
| <a id="property-stripped"></a> `stripped` | `readonly` | `boolean` | Whether matches were stripped. | [packages/tools/src/inbound/sanitize.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L51) |
| <a id="property-wrapped"></a> `wrapped` | `readonly` | `boolean` | Whether the body is wrapped in the untrusted-content envelope. | [packages/tools/src/inbound/sanitize.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L49) |
