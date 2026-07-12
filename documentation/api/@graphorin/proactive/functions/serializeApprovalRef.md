[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / serializeApprovalRef

# Function: serializeApprovalRef()

```ts
function serializeApprovalRef(ref): string;
```

Defined in: [packages/proactive/src/approval-ref.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/approval-ref.ts#L29)

Serialize an approval address as `run:<runId>:<toolCallId>` with
URI-encoded segments. Throws `TypeError` on an empty segment.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ref` | [`AgentApprovalRef`](/api/@graphorin/proactive/interfaces/AgentApprovalRef.md) |

## Returns

`string`

## Stable
