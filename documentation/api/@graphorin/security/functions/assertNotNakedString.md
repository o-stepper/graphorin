[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / assertNotNakedString

# Function: assertNotNakedString()

```ts
function assertNotNakedString(input): void;
```

Defined in: packages/security/src/secrets/secret-ref.ts:668

**`Stable`**

Reject naked strings (no scheme) at validation time. Used by the
resolver dispatcher so a typo in `*Ref` config does not silently fall
through to a default scheme.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` |

## Returns

`void`
