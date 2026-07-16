[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / getHardeningStatus

# Function: getHardeningStatus()

```ts
function getHardeningStatus(): 
  | HardeningStatus
  | undefined;
```

Defined in: [packages/security/src/hardening/apply.ts:124](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/apply.ts#L124)

Read the resolved hardening status. Returns `undefined` when
`applyProcessHardening(...)` has not been called yet.

## Returns

  \| [`HardeningStatus`](/api/@graphorin/security/interfaces/HardeningStatus.md)
  \| `undefined`

## Stable
