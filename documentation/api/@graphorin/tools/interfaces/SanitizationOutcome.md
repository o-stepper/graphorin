[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / SanitizationOutcome

# Interface: SanitizationOutcome

Defined in: [packages/tools/src/inbound/sanitize.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L40)

Outcome of [applyInboundSanitization](/api/@graphorin/tools/functions/applyInboundSanitization.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-blocked"></a> `blocked` | `readonly` | `boolean` | Set when `failClosed: true` and at least one pattern fired. The executor surfaces this as `ToolError({ kind: 'inbound_sanitization_blocked' })`. | [packages/tools/src/inbound/sanitize.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L61) |
| <a id="property-body"></a> `body` | `readonly` | `string` | Final body that flows downstream. | [packages/tools/src/inbound/sanitize.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L42) |
| <a id="property-bytesstripped"></a> `bytesStripped` | `readonly` | `number` | Bytes removed by the strip pass. | [packages/tools/src/inbound/sanitize.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L52) |
| <a id="property-modified"></a> `modified` | `readonly` | `boolean` | Whether the body was modified relative to the input. | [packages/tools/src/inbound/sanitize.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L44) |
| <a id="property-patternshit"></a> `patternsHit` | `readonly` | readonly `string`[] | Pattern names that fired during the scan. | [packages/tools/src/inbound/sanitize.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L46) |
| <a id="property-scandurationus"></a> `scanDurationUs` | `readonly` | `number` | Time spent on the scan in microseconds. | [packages/tools/src/inbound/sanitize.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L54) |
| <a id="property-scantimedout"></a> `scanTimedOut` | `readonly` | `boolean` | Whether the scan timed out (best-effort fallthrough). | [packages/tools/src/inbound/sanitize.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L56) |
| <a id="property-stripped"></a> `stripped` | `readonly` | `boolean` | Whether matches were stripped. | [packages/tools/src/inbound/sanitize.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L50) |
| <a id="property-wrapped"></a> `wrapped` | `readonly` | `boolean` | Whether the body is wrapped in the untrusted-content envelope. | [packages/tools/src/inbound/sanitize.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/sanitize.ts#L48) |
