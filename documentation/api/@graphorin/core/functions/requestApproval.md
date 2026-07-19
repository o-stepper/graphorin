[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / requestApproval

# Function: requestApproval()

```ts
function requestApproval<TDecision>(
   name, 
   payload?, 
   options?): TDecision;
```

Defined in: packages/core/src/channels/durable.ts:273

**`Stable`**

Suspend on a named persisted approval. Resolved by
`workflow.approve(threadId, name, decision)`; the decision is returned
here. The optional payload is surfaced on the pending pause record so
an approval UI can show what is being approved. With
`options.timeoutAt` the approval also carries a durable deadline -
see [RequestApprovalOptions](/api/@graphorin/core/interfaces/RequestApprovalOptions.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDecision` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `payload?` | `unknown` |
| `options?` | [`RequestApprovalOptions`](/api/@graphorin/core/interfaces/RequestApprovalOptions.md) |

## Returns

`TDecision`
