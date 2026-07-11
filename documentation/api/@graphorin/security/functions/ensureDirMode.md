[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ensureDirMode

# Function: ensureDirMode()

```ts
function ensureDirMode(
   path, 
   mode, 
opts?): Promise<void>;
```

Defined in: [packages/security/src/hardening/file-modes.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/file-modes.ts#L77)

Ensure a directory exists at the supplied POSIX mode. Creates the
directory recursively when it does not exist.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `mode` | `number` |
| `opts?` | \{ `warn?`: (`message`) => `void`; \} |
| `opts.warn?` | (`message`) => `void` |

## Returns

`Promise`\&lt;`void`\&gt;

## Stable
