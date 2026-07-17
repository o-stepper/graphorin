[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AUTHORITY\_OPTIONAL\_SCHEMES

# Variable: AUTHORITY\_OPTIONAL\_SCHEMES

```ts
const AUTHORITY_OPTIONAL_SCHEMES: ReadonlySet<string>;
```

Defined in: [packages/security/src/secrets/secret-ref.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/secret-ref.ts#L43)

Schemes whose authority component is optional. `file:` and
`encrypted-file:` accept either `file:///abs/path` (authority empty)
or `file:relative/path` (opaque). `vault://` accepts both an explicit
server (`vault://host:port/...`) and an opaque form that defers to
the `VAULT_ADDR` environment variable.

## Stable
