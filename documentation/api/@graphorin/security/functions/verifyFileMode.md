[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / verifyFileMode

# Function: verifyFileMode()

```ts
function verifyFileMode(path, expected): Promise<{
  actual: number;
  ok: boolean;
}>;
```

Defined in: packages/security/src/hardening/file-modes.ts:98

Read the current POSIX mode and report whether it matches.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `expected` | `number` |

## Returns

`Promise`\<\{
  `actual`: `number`;
  `ok`: `boolean`;
\}\>

## Stable
