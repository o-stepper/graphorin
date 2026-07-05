[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WireRunState

# Type Alias: WireRunState

```ts
type WireRunState = Omit<RunState, "messages" | "steps"> & {
  messages: readonly WireMessage[];
  steps: readonly WireRunStep[];
};
```

Defined in: packages/core/src/utils/binary-json.ts:144

JSON-safe twin of [RunState](/api/@graphorin/core/interfaces/RunState.md): `messages` and every
`steps[].toolCalls[].outcome.contentParts` are projected through the
binary codec. Everything else is structurally identical.

`pendingApprovals[].args` and `ToolResult.output` are model-produced
JSON and are assumed JSON-safe already - the projection does not
walk them.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `messages` | readonly [`WireMessage`](/api/@graphorin/core/type-aliases/WireMessage.md)[] | packages/core/src/utils/binary-json.ts:145 |
| `steps` | readonly [`WireRunStep`](/api/@graphorin/core/type-aliases/WireRunStep.md)[] | packages/core/src/utils/binary-json.ts:146 |

## Stable
