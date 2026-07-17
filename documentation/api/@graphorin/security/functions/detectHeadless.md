[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / detectHeadless

# Function: detectHeadless()

```ts
function detectHeadless(): {
  headless: boolean;
  reasons: readonly string[];
};
```

Defined in: [packages/security/src/secrets/factory.ts:144](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/factory.ts#L144)

Detect whether the host is "headless" - that is, no interactive
terminal is attached and the process is likely running unattended.
The result drives the `'auto'` chain's keyring vs. encrypted-file
decision.

## Returns

```ts
{
  headless: boolean;
  reasons: readonly string[];
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `headless` | `boolean` | [packages/security/src/secrets/factory.ts:144](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/factory.ts#L144) |
| `reasons` | readonly `string`[] | [packages/security/src/secrets/factory.ts:144](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/factory.ts#L144) |

## Stable
