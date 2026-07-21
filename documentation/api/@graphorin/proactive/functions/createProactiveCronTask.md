[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / createProactiveCronTask

# Function: createProactiveCronTask()

```ts
function createProactiveCronTask<TDeps>(options): ProactiveCronTask;
```

Defined in: packages/proactive/src/cron-task.ts:235

**`Stable`**

Build a [ProactiveCronTask](/api/@graphorin/proactive/interfaces/ProactiveCronTask.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateProactiveCronTaskOptions`](/api/@graphorin/proactive/interfaces/CreateProactiveCronTaskOptions.md)\&lt;`TDeps`\&gt; |

## Returns

[`ProactiveCronTask`](/api/@graphorin/proactive/interfaces/ProactiveCronTask.md)
