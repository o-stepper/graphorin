[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / isLiteralAllowed

# Function: isLiteralAllowed()

```ts
function isLiteralAllowed(): {
  allowed: boolean;
  reasons: readonly string[];
};
```

Defined in: [packages/security/src/secrets/resolvers/literal.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/resolvers/literal.ts#L33)

Whether the `literal:` scheme is currently active. Used by the
factory's status reporter and by the resolver itself.

## Returns

```ts
{
  allowed: boolean;
  reasons: readonly string[];
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `allowed` | `boolean` | [packages/security/src/secrets/resolvers/literal.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/resolvers/literal.ts#L34) |
| `reasons` | readonly `string`[] | [packages/security/src/secrets/resolvers/literal.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/resolvers/literal.ts#L35) |

## Stable
