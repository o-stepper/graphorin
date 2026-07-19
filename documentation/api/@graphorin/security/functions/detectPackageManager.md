[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / detectPackageManager

# Function: detectPackageManager()

```ts
function detectPackageManager(env?): PackageManagerKind;
```

Defined in: packages/security/src/supply-chain/package-manager.ts:83

**`Stable`**

Detect the available package manager. Prefers `pnpm` (project
default) and falls back to `npm` and `yarn`.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `env` | `ProcessEnv` | `process.env` |

## Returns

[`PackageManagerKind`](/api/@graphorin/security/type-aliases/PackageManagerKind.md)
