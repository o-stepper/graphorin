[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / serializeAwakeableRef

# Function: serializeAwakeableRef()

```ts
function serializeAwakeableRef(ref): string;
```

Defined in: [packages/workflow/src/awakeable-ref.ts:38](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/awakeable-ref.ts#L38)

Serialize an [AwakeableRef](/api/@graphorin/workflow/interfaces/AwakeableRef.md) into `wf:<workflowId>:<threadId>:<name>`
with URI-encoded segments. Throws `TypeError` when any segment is
empty - a partial address is unresolvable by construction.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ref` | [`AwakeableRef`](/api/@graphorin/workflow/interfaces/AwakeableRef.md) |

## Returns

`string`

## Stable
