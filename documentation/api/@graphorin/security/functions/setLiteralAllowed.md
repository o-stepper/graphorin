[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / setLiteralAllowed

# Function: setLiteralAllowed()

```ts
function setLiteralAllowed(allowed): void;
```

Defined in: packages/security/src/secrets/resolvers/literal.ts:23

**`Stable`**

Programmatic gate - set from `secrets.allowLiteral: true` in user
config. Must be combined with the env gate to actually unlock the
`literal:` scheme.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `allowed` | `boolean` |

## Returns

`void`
