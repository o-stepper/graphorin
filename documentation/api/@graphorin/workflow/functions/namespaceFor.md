[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / namespaceFor

# Function: namespaceFor()

```ts
function namespaceFor(config): string;
```

Defined in: packages/workflow/src/internal/engine.ts:128

**`Internal`**

- workflow namespace used in checkpoint store keys. The
engine binds the namespace to the workflow `name` so a single store
can host checkpoints from multiple workflows without collision.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | \{ `name`: `string`; \} |
| `config.name` | `string` |

## Returns

`string`
