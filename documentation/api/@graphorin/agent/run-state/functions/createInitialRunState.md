[**Graphorin API reference v0.9.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / createInitialRunState

# Function: createInitialRunState()

```ts
function createInitialRunState(args): RunState;
```

Defined in: [packages/agent/src/run-state/index.ts:511](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/run-state/index.ts#L511)

Build a fresh, minimal [RunState](/api/@graphorin/core/interfaces/RunState.md) for a new run. Helper used
by `createAgent({...})` so consumers can construct deterministic
run state in tests.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `agentId`: `string`; `id`: `string`; `sessionId`: `string`; `startedAt?`: `string`; `userId?`: `string`; \} |
| `args.agentId` | `string` |
| `args.id` | `string` |
| `args.sessionId` | `string` |
| `args.startedAt?` | `string` |
| `args.userId?` | `string` |

## Returns

[`RunState`](/api/@graphorin/core/interfaces/RunState.md)

## Stable
