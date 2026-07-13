[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / namespaceFor

# Function: namespaceFor()

```ts
function namespaceFor(config): string;
```

Defined in: [packages/workflow/src/internal/engine.ts:130](https://github.com/o-stepper/graphorin/blob/main/packages/workflow/src/internal/engine.ts#L130)

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
