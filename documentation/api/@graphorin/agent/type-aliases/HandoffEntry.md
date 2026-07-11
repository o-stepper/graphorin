[**Graphorin API reference v0.8.0**](../../../index.md)

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

Defined in: [packages/agent/src/types.ts:128](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L128)

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
| `forwardEvents?` | `SubagentForwardPolicy` | W-036: which child events forward into the parent stream. | [packages/agent/src/types.ts:136](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L136) |
| `inputFilter?` | [`HandoffFilter`](/api/@graphorin/core/type-aliases/HandoffFilter.md) | - | [packages/agent/src/types.ts:134](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L134) |
| `target` | [`Agent`](/api/@graphorin/agent/interfaces/Agent.md)\&lt;`TDeps`, `any`\&gt; | - | [packages/agent/src/types.ts:133](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L133) |

## Stable
