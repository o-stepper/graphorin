[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / sleepUntil

# Function: sleepUntil()

```ts
function sleepUntil(at): void;
```

Defined in: [packages/core/src/channels/durable.ts:126](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L126)

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
