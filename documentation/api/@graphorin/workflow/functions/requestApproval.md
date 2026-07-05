[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / requestApproval

# Function: requestApproval()

```ts
function requestApproval<TDecision>(name, payload?): TDecision;
```

Defined in: packages/core/dist/channels/durable.d.ts:91

Suspend on a named persisted approval. Resolved by
`workflow.approve(threadId, name, decision)`; the decision is returned
here. The optional payload is surfaced on the pending pause record so
an approval UI can show what is being approved.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDecision` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `payload?` | `unknown` |

## Returns

`TDecision`

## Stable
