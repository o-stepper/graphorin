[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / parseAwakeableRef

# Function: parseAwakeableRef()

```ts
function parseAwakeableRef(raw): 
  | AwakeableRef
  | null;
```

Defined in: [packages/workflow/src/awakeable-ref.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/awakeable-ref.ts#L66)

Parse a string produced by [serializeAwakeableRef](/api/@graphorin/workflow/functions/serializeAwakeableRef.md). Returns
`null` on anything malformed (wrong prefix, wrong arity, empty or
undecodable segments) - callback data arriving from a channel is
untrusted input, so the parse never throws.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `string` |

## Returns

  \| [`AwakeableRef`](/api/@graphorin/workflow/interfaces/AwakeableRef.md)
  \| `null`

## Stable
