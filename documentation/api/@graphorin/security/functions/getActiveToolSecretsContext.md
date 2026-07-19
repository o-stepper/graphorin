[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / getActiveToolSecretsContext

# Function: getActiveToolSecretsContext()

```ts
function getActiveToolSecretsContext(): 
  | ToolSecretsContext
  | undefined;
```

Defined in: packages/security/src/secrets/acl.ts:53

**`Stable`**

Read the active per-tool secrets context, if any. Returns
`undefined` outside an explicit `withToolSecretsContext(...)` scope -
which means "no ACL enforcement".

## Returns

  \| [`ToolSecretsContext`](/api/@graphorin/security/interfaces/ToolSecretsContext.md)
  \| `undefined`
