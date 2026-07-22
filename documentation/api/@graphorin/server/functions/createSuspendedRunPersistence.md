[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createSuspendedRunPersistence

# Function: createSuspendedRunPersistence()

```ts
function createSuspendedRunPersistence(options): SuspendedRunPersistenceHooks;
```

Defined in: packages/server/src/runtime/suspended-run-persistence.ts:58

**`Stable`**

Build the [SuspendedRunPersistenceHooks](/api/@graphorin/server/interfaces/SuspendedRunPersistenceHooks.md) delegate the server
installs via `runs.setSuspendedRunPersistence(...)`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`SuspendedRunPersistenceOptions`](/api/@graphorin/server/interfaces/SuspendedRunPersistenceOptions.md) |

## Returns

[`SuspendedRunPersistenceHooks`](/api/@graphorin/server/interfaces/SuspendedRunPersistenceHooks.md)
