[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / sleepUntil

# Function: sleepUntil()

```ts
function sleepUntil(at): void;
```

Defined in: [packages/core/dist/channels/durable.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/durable.d.ts)

Durably sleep until an absolute instant. Suspends the workflow thread
with a persisted wake-at timestamp; `workflow.tick(threadId)` resumes
it once due. Returns nothing on resume.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `at` | `string` \| `number` \| `Date` |

## Returns

`void`

## Stable
