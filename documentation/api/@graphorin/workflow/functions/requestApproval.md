[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / requestApproval

# Function: requestApproval()

```ts
function requestApproval<TDecision>(
   name, 
   payload?, 
   options?): TDecision;
```

Defined in: [packages/core/dist/channels/durable.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/durable.d.ts)

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

## Stable
