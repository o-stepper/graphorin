[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ensureFileMode

# Function: ensureFileMode()

```ts
function ensureFileMode(
   path, 
   mode, 
opts?): Promise<void>;
```

Defined in: packages/security/src/hardening/file-modes.ts:45

Ensure a file is at the supplied POSIX mode. The function:

 - On Windows / non-POSIX hosts, calls `warn(...)` and returns.
 - Else opens the file, runs `fchmod` if the process started with
   `--permission`, otherwise plain `chmod`.
 - Verifies the mode via `lstat` and throws
   `FileModeMismatchError` if the post-condition fails.

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
