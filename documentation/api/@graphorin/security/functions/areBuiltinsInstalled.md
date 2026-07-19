[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / areBuiltinsInstalled

# Function: areBuiltinsInstalled()

```ts
function areBuiltinsInstalled(): boolean;
```

Defined in: packages/security/src/secrets/resolvers/registry.ts:125

**`Internal`**

Whether the built-in resolver set has been installed in the current
registry. The factory and `validateSecretRefs(...)` use this to
surface the "did you forget to import @graphorin/security?" failure
early.

## Returns

`boolean`
