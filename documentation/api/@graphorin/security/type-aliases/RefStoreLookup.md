[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / RefStoreLookup

# Type Alias: RefStoreLookup

```ts
type RefStoreLookup = (key, ctx?) => Promise<SecretValue | null>;
```

Defined in: [packages/security/src/secrets/resolvers/ref.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/resolvers/ref.ts#L18)

**`Internal`**

Optional callback used by the `ref:` scheme to ask the active
`SecretsStore` for a value. The factory wires this up so the
resolver can dispatch through whatever fallback chain is currently
active without taking a hard dependency on the store module.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `ctx?` | [`SecretResolverContext`](/api/@graphorin/core/interfaces/SecretResolverContext.md) |

## Returns

`Promise`\&lt;[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md) \| `null`\&gt;
