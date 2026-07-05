[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / withChildToolSecretsContext

# Function: withChildToolSecretsContext()

```ts
function withChildToolSecretsContext<T>(child, fn): T;
```

Defined in: packages/security/src/secrets/acl.ts:114

Convenience: run `fn` inside a child scope rooted at the current
active context. Used by `@graphorin/agent` to wire sub-agent calls.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `child` | `Omit`\&lt;[`ToolSecretsContext`](/api/@graphorin/security/interfaces/ToolSecretsContext.md), `"parent"`\&gt; |
| `fn` | () => `T` |

## Returns

`T`

## Stable
