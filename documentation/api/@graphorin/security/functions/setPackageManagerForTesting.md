[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / \_setPackageManagerForTesting

# Function: \_setPackageManagerForTesting()

```ts
function _setPackageManagerForTesting(detector): 
  | (() => PackageManagerKind)
  | null;
```

Defined in: [packages/security/src/supply-chain/package-manager.ts:69](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/package-manager.ts#L69)

**`Experimental`**

Override the detected package manager. Returns the previous value.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `detector` | \| (() => [`PackageManagerKind`](/api/@graphorin/security/type-aliases/PackageManagerKind.md)) \| `null` |

## Returns

  \| (() => [`PackageManagerKind`](/api/@graphorin/security/type-aliases/PackageManagerKind.md))
  \| `null`
