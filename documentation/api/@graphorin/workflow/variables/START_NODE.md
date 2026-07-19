[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / START\_NODE

# Variable: START\_NODE

```ts
const START_NODE: "__start__";
```

Defined in: packages/workflow/src/types.ts:26

**`Stable`**

Sentinel name reserved for the implicit start node. Edges originate
from `__start__` and the engine creates the bootstrap task that
applies the supplied input to the first user-defined node.
