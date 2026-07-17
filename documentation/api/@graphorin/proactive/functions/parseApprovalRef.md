[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / parseApprovalRef

# Function: parseApprovalRef()

```ts
function parseApprovalRef(raw): 
  | AgentApprovalRef
  | null;
```

Defined in: [packages/proactive/src/approval-ref.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/proactive/src/approval-ref.ts#L45)

Parse a `run:<runId>:<toolCallId>` ref. Returns `null` on anything
malformed - callback-data is untrusted channel input and must never
throw at the parse boundary.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `string` |

## Returns

  \| [`AgentApprovalRef`](/api/@graphorin/proactive/interfaces/AgentApprovalRef.md)
  \| `null`

## Stable
