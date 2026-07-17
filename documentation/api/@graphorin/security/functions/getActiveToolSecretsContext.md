[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / getActiveToolSecretsContext

# Function: getActiveToolSecretsContext()

```ts
function getActiveToolSecretsContext(): 
  | ToolSecretsContext
  | undefined;
```

Defined in: [packages/security/src/secrets/acl.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/acl.ts#L53)

Read the active per-tool secrets context, if any. Returns
`undefined` outside an explicit `withToolSecretsContext(...)` scope -
which means "no ACL enforcement".

## Returns

  \| [`ToolSecretsContext`](/api/@graphorin/security/interfaces/ToolSecretsContext.md)
  \| `undefined`

## Stable
