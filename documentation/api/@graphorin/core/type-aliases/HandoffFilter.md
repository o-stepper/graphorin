[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / HandoffFilter

# Type Alias: HandoffFilter

```ts
type HandoffFilter = (history) => readonly Message[];
```

Defined in: [packages/core/src/types/handoff.ts:16](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/handoff.ts#L16)

Filter applied to the parent's message history when handing off control
to a target agent. Implementations live in `@graphorin/agent` (e.g.
`filters.lastN(10)`); the contract type lives here so every package
(server, sessions, observability, …) can type a parameter as
`HandoffFilter` without an agent dependency.

The default for the agent runtime is `lastN(10)` (per the security-first
compose policy). Filters should be **pure** - they receive a frozen
history and return a fresh array.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `history` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] |

## Returns

readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]

## Stable
