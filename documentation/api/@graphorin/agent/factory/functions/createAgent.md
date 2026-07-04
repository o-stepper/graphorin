[**Graphorin API reference v0.5.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [factory](/api/@graphorin/agent/factory/index.md) / createAgent

# Function: createAgent()

```ts
function createAgent<TDeps, TOutput>(config): Agent<TDeps, TOutput>;
```

Defined in: packages/agent/src/factory.ts:906

Build a fresh [Agent](/api/@graphorin/agent/interfaces/Agent.md) from the supplied configuration.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |
| `TOutput` | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`AgentConfig`](/api/@graphorin/agent/interfaces/AgentConfig.md)\&lt;`TDeps`, `TOutput`\&gt; |

## Returns

[`Agent`](/api/@graphorin/agent/interfaces/Agent.md)\&lt;`TDeps`, `TOutput`\&gt;

## Stable
