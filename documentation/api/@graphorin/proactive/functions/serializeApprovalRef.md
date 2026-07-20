[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / serializeApprovalRef

# Function: serializeApprovalRef()

```ts
function serializeApprovalRef(ref): string;
```

Defined in: packages/proactive/src/approval-ref.ts:29

**`Stable`**

Serialize an approval address as `run:<runId>:<toolCallId>` with
URI-encoded segments. Throws `TypeError` on an empty segment.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ref` | [`AgentApprovalRef`](/api/@graphorin/proactive/interfaces/AgentApprovalRef.md) |

## Returns

`string`
