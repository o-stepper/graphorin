[**Graphorin API reference v0.12.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [outbound](/api/@graphorin/tools/outbound/index.md) / splitByWrapEnvelope

# Function: splitByWrapEnvelope()

```ts
function splitByWrapEnvelope(
   text, 
   open, 
   close): readonly {
  kind: "wrapped" | "plain";
  text: string;
}[];
```

Defined in: [packages/tools/src/outbound/commentary-patterns.ts:158](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/outbound/commentary-patterns.ts#L158)

Split a body into already-wrapped + plain segments so a sanitizer
never re-scans inside an existing wrap envelope. This is the
idempotency primitive that makes layered outbound sanitization
(storage-write, wire-emission, channel delivery) composable: a
second pass over previously-sanitized output is bytes-equal.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `text` | `string` |
| `open` | `string` |
| `close` | `string` |

## Returns

readonly \{
  `kind`: `"wrapped"` \| `"plain"`;
  `text`: `string`;
\}[]

## Stable
