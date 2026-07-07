[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireRunState

# Type Alias: WireRunState

```ts
type WireRunState = Omit<RunState, "messages" | "steps" | "pendingSubRuns"> & {
  messages: readonly WireMessage[];
  pendingSubRuns?: readonly WirePendingSubRun[];
  steps: readonly WireRunStep[];
};
```

Defined in: [packages/core/src/utils/binary-json.ts:150](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L150)

JSON-safe twin of [RunState](/api/@graphorin/core/interfaces/RunState.md): `messages`, every
`steps[].toolCalls[].outcome.contentParts`, and each parked
`pendingSubRuns[].state` (recursively, W-001) are projected through
the binary codec. Everything else is structurally identical.

`pendingApprovals[].args` and `ToolResult.output` are model-produced
JSON and are assumed JSON-safe already - the projection does not
walk them.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `messages` | readonly [`WireMessage`](/api/@graphorin/core/type-aliases/WireMessage.md)[] | [packages/core/src/utils/binary-json.ts:151](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L151) |
| `pendingSubRuns?` | readonly `WirePendingSubRun`[] | [packages/core/src/utils/binary-json.ts:153](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L153) |
| `steps` | readonly [`WireRunStep`](/api/@graphorin/core/type-aliases/WireRunStep.md)[] | [packages/core/src/utils/binary-json.ts:152](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/utils/binary-json.ts#L152) |

## Stable
