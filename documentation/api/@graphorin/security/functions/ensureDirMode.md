[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ensureDirMode

# Function: ensureDirMode()

```ts
function ensureDirMode(
   path, 
   mode, 
opts?): Promise<void>;
```

Defined in: packages/security/src/hardening/file-modes.ts:76

**`Stable`**

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
