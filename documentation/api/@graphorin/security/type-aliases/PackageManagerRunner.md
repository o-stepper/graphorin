[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / PackageManagerRunner

# Type Alias: PackageManagerRunner

```ts
type PackageManagerRunner = (args) => Promise<PackageManagerResult>;
```

Defined in: packages/security/src/supply-chain/package-manager.ts:32

**`Experimental`**

Strategy hook: replace the default `child_process.spawn` runner.
Tests use this to assert the correct CLI is invoked without
actually shelling out.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `args`: `ReadonlyArray`\&lt;`string`\&gt;; `command`: `string`; `cwd?`: `string`; `env?`: `NodeJS.ProcessEnv`; `signal?`: `AbortSignal`; \} |
| `args.args` | `ReadonlyArray`\&lt;`string`\&gt; |
| `args.command` | `string` |
| `args.cwd?` | `string` |
| `args.env?` | `NodeJS.ProcessEnv` |
| `args.signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;[`PackageManagerResult`](/api/@graphorin/security/interfaces/PackageManagerResult.md)\&gt;
