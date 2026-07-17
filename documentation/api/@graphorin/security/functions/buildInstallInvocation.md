[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / buildInstallInvocation

# Function: buildInstallInvocation()

```ts
function buildInstallInvocation(args): {
  args: readonly string[];
  command: string;
};
```

Defined in: [packages/security/src/supply-chain/package-manager.ts:100](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/package-manager.ts#L100)

Build the CLI invocation for an install request. Encapsulates the
subtle differences between the supported package managers.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `cwd?`: `string`; `ignoreScripts`: `boolean`; `manager`: [`PackageManagerKind`](/api/@graphorin/security/type-aliases/PackageManagerKind.md); `packageSpec`: `string`; \} |
| `args.cwd?` | `string` |
| `args.ignoreScripts` | `boolean` |
| `args.manager` | [`PackageManagerKind`](/api/@graphorin/security/type-aliases/PackageManagerKind.md) |
| `args.packageSpec` | `string` |

## Returns

```ts
{
  args: readonly string[];
  command: string;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `args` | readonly `string`[] | [packages/security/src/supply-chain/package-manager.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/package-manager.ts#L105) |
| `command` | `string` | [packages/security/src/supply-chain/package-manager.ts:105](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/package-manager.ts#L105) |

## Stable
