[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SCOPE\_CATALOGUE

# Variable: SCOPE\_CATALOGUE

```ts
const SCOPE_CATALOGUE: ReadonlyArray<string>;
```

Defined in: packages/security/src/auth/scope.ts:149

**`Stable`**

Canonical catalogue of scopes recognised by the framework. Wider
deployments are free to introduce additional scope strings; the
catalogue exists so middleware authors can reference a single
source of truth and so the CLI can enumerate the well-known scopes
for tab-completion.
