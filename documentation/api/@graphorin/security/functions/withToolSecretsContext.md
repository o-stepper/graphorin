[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / withToolSecretsContext

# Function: withToolSecretsContext()

```ts
function withToolSecretsContext<T>(ctx, fn): T;
```

Defined in: packages/security/src/secrets/acl.ts:42

**`Stable`**

Run `fn` with `ctx` set as the active per-tool secrets context. Used
by `@graphorin/tools` and `@graphorin/agent` to wrap tool/agent
execution.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`ToolSecretsContext`](/api/@graphorin/security/interfaces/ToolSecretsContext.md) |
| `fn` | () => `T` |

## Returns

`T`
