[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / getSubAgentToolRefs

# Function: getSubAgentToolRefs()

```ts
function getSubAgentToolRefs(tool): 
  | SubAgentToolRefs
  | undefined;
```

Defined in: packages/agent/src/runtime/agent-to-tool.ts:121

Read the [SUBAGENT\_TOOL](/api/@graphorin/agent/variables/SUBAGENT_TOOL.md) refs off a (possibly wrapped) tool.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `tool` | `unknown` |

## Returns

  \| [`SubAgentToolRefs`](/api/@graphorin/agent/interfaces/SubAgentToolRefs.md)
  \| `undefined`
