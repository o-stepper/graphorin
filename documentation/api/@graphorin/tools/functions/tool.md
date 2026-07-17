[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / tool

# Function: tool()

```ts
function tool<TInput, TOutput, TDeps>(spec): Tool<TInput, TOutput, TDeps>;
```

Defined in: [packages/tools/src/builder/tool.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/builder/tool.ts#L57)

Build a `Tool` instance from a spec. Type inference flows from the
`inputSchema` / `outputSchema` Zod types into the `execute` callback
so authors do not have to repeat the input shape.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | - |
| `TOutput` | - |
| `TDeps` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `spec` | [`ToolSpec`](/api/@graphorin/tools/type-aliases/ToolSpec.md)\&lt;`TInput`, `TOutput`, `TDeps`\&gt; |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`TInput`, `TOutput`, `TDeps`\&gt;

## Example

```ts
const search = tool({
  name: 'search-issues',
  description: 'Search the project tracker for issues matching a query.',
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ hits: z.array(z.object({ id: z.string(), title: z.string() })) }),
  sideEffectClass: 'read-only',
  async execute(input, ctx) {
    // ...
  },
});
```

## Stable
