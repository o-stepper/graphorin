[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / \_setPackageManagerRunnerForTesting

# Function: \_setPackageManagerRunnerForTesting()

```ts
function _setPackageManagerRunnerForTesting(runner): 
  | PackageManagerRunner
  | null;
```

Defined in: packages/security/src/supply-chain/package-manager.ts:53

**`Experimental`**

Override the runner. Returns the previous runner so tests can
restore the default at the end of a fixture.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `runner` | \| [`PackageManagerRunner`](/api/@graphorin/security/type-aliases/PackageManagerRunner.md) \| `null` |

## Returns

  \| [`PackageManagerRunner`](/api/@graphorin/security/type-aliases/PackageManagerRunner.md)
  \| `null`
