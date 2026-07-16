[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / HandoffEntry

# Type Alias: HandoffEntry\&lt;TDeps\&gt;

```ts
type HandoffEntry<TDeps> = 
  | Agent<TDeps, any>
  | {
  forwardEvents?: SubagentForwardPolicy;
  inputFilter?: HandoffFilter;
  target: Agent<TDeps, any>;
};
```

Defined in: [packages/agent/src/types.ts:140](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L140)

Handoff target entry accepted by `createAgent({ handoffs })`.
Either a bare [Agent](/api/@graphorin/agent/interfaces/Agent.md) reference (default filter applied) or
an explicit `{ target, inputFilter? }` envelope.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |

## Union Members

[`Agent`](/api/@graphorin/agent/interfaces/Agent.md)\&lt;`TDeps`, `any`\&gt;

***

### Type Literal

```ts
{
  forwardEvents?: SubagentForwardPolicy;
  inputFilter?: HandoffFilter;
  target: Agent<TDeps, any>;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `forwardEvents?` | `SubagentForwardPolicy` | W-036: which child events forward into the parent stream. | [packages/agent/src/types.ts:148](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L148) |
| `inputFilter?` | [`HandoffFilter`](/api/@graphorin/core/type-aliases/HandoffFilter.md) | - | [packages/agent/src/types.ts:146](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L146) |
| `target` | [`Agent`](/api/@graphorin/agent/interfaces/Agent.md)\&lt;`TDeps`, `any`\&gt; | - | [packages/agent/src/types.ts:145](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L145) |

## Stable
