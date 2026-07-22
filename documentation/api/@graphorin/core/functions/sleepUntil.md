[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / sleepUntil

# Function: sleepUntil()

```ts
function sleepUntil(at): void;
```

Defined in: packages/core/src/channels/durable.ts:126

**`Stable`**

Durably sleep until an absolute instant. Suspends the workflow thread
with a persisted wake-at timestamp; `workflow.tick(threadId)` resumes
it once due. Returns nothing on resume.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `at` | `string` \| `number` \| `Date` |

## Returns

`void`
