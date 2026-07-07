[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / generatePepper

# Function: generatePepper()

```ts
function generatePepper(): SecretValue;
```

Defined in: [packages/security/src/auth/crud.ts:258](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/crud.ts#L258)

Generate a fresh server pepper. The result is always exactly 32
bytes (256 bits) so the verifier can rely on the size invariant.

## Returns

[`SecretValue`](/api/@graphorin/security/classes/SecretValue.md)

## Stable
