[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / SuspendedRunRegistryLike

# Interface: SuspendedRunRegistryLike

Defined in: packages/proactive/src/cron-task.ts:194

**`Stable`**

Structural slice of the server's `RunStateTracker` the C3 bridge
needs - no dependency on `@graphorin/server`.

## Methods

### registerSuspended()

```ts
registerSuspended(
   runId, 
   descriptor, 
   state): void;
```

Defined in: packages/proactive/src/cron-task.ts:195

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `runId` | `string` |
| `descriptor` | \{ `agentId`: `string`; `kind`: `"agent"`; `sessionId?`: `string`; `userId?`: `string`; \} |
| `descriptor.agentId` | `string` |
| `descriptor.kind` | `"agent"` |
| `descriptor.sessionId?` | `string` |
| `descriptor.userId?` | `string` |
| `state` | `unknown` |

#### Returns

`void`
