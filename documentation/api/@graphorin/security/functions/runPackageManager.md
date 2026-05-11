[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / runPackageManager

# Function: runPackageManager()

```ts
function runPackageManager(args): Promise<PackageManagerResult>;
```

Defined in: packages/security/src/supply-chain/package-manager.ts:138

Run a package-manager invocation. Returns the buffered stdout +
stderr; a non-zero exit code is reported to the caller via the
`exitCode` field rather than thrown.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `args`: readonly `string`[]; `command`: `string`; `cwd?`: `string`; `env?`: `ProcessEnv`; `signal?`: `AbortSignal`; \} |
| `args.args` | readonly `string`[] |
| `args.command` | `string` |
| `args.cwd?` | `string` |
| `args.env?` | `ProcessEnv` |
| `args.signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;[`PackageManagerResult`](/api/@graphorin/security/interfaces/PackageManagerResult.md)\&gt;

## Stable
