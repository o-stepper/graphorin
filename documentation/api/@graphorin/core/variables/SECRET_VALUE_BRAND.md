[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SECRET\_VALUE\_BRAND

# Variable: SECRET\_VALUE\_BRAND

```ts
const SECRET_VALUE_BRAND: unique symbol;
```

Defined in: packages/core/src/contracts/secret-value.ts:9

**`Stable`**

Cross-realm symbol used to brand `SecretValue` instances. Implementations
(e.g. the wrapper class shipped from `@graphorin/security`) attach this
symbol so that `isSecretValue(...)` works across realms (Worker threads,
sandboxes, etc.).
