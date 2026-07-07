[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / requestApproval

# Function: requestApproval()

```ts
function requestApproval<TDecision>(name, payload?): TDecision;
```

Defined in: [packages/core/src/channels/durable.ts:142](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L142)

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
