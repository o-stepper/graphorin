[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / TASKS\_CHANNEL

# Variable: TASKS\_CHANNEL

```ts
const TASKS_CHANNEL: "__graphorin_tasks__";
```

Defined in: packages/workflow/src/types.ts:43

**`Internal`**

Internal stream channel name that holds the queue of dynamic
tasks scheduled via [Dispatch](/api/@graphorin/workflow/classes/Dispatch.md). Reserved namespace: do not
declare a channel with this key in user code.
