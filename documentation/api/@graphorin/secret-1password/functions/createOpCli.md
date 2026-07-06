[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/secret-1password](/api/@graphorin/secret-1password/index.md) / [](/api/@graphorin/secret-1password/README.md) / createOpCli

# Function: createOpCli()

```ts
function createOpCli(deps?): OpCli;
```

Defined in: packages/secret-1password/src/op-cli.ts:127

[OpCli](/api/@graphorin/secret-1password/interfaces/OpCli.md) factory with an injectable `spawn` (for tests). Production
code uses [createDefaultOpCli](/api/@graphorin/secret-1password/functions/createDefaultOpCli.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | \{ `spawn?`: \{ (`command`, `options?`): `ChildProcessWithoutNullStreams`; (`command`, `options`): `ChildProcessByStdio`\<`Writable`, `Readable`, `Readable`\>; (`command`, `options`): `ChildProcessByStdio`\<`Writable`, `Readable`, `null`\>; (`command`, `options`): `ChildProcessByStdio`\<`Writable`, `null`, `Readable`\>; (`command`, `options`): `ChildProcessByStdio`\<`null`, `Readable`, `Readable`\>; (`command`, `options`): `ChildProcessByStdio`\<`Writable`, `null`, `null`\>; (`command`, `options`): `ChildProcessByStdio`\<`null`, `Readable`, `null`\>; (`command`, `options`): `ChildProcessByStdio`\<`null`, `null`, `Readable`\>; (`command`, `options`): `ChildProcessByStdio`\<`null`, `null`, `null`\>; (`command`, `options`): `ChildProcess`; (`command`, `args?`, `options?`): `ChildProcessWithoutNullStreams`; (`command`, `args`, `options`): `ChildProcessByStdio`\<`Writable`, `Readable`, `Readable`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`Writable`, `Readable`, `null`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`Writable`, `null`, `Readable`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`null`, `Readable`, `Readable`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`Writable`, `null`, `null`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`null`, `Readable`, `null`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`null`, `null`, `Readable`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`null`, `null`, `null`\>; (`command`, `args`, `options`): `ChildProcess`; \}; \} |
| `deps.spawn?` | \{ (`command`, `options?`): `ChildProcessWithoutNullStreams`; (`command`, `options`): `ChildProcessByStdio`\<`Writable`, `Readable`, `Readable`\>; (`command`, `options`): `ChildProcessByStdio`\<`Writable`, `Readable`, `null`\>; (`command`, `options`): `ChildProcessByStdio`\<`Writable`, `null`, `Readable`\>; (`command`, `options`): `ChildProcessByStdio`\<`null`, `Readable`, `Readable`\>; (`command`, `options`): `ChildProcessByStdio`\<`Writable`, `null`, `null`\>; (`command`, `options`): `ChildProcessByStdio`\<`null`, `Readable`, `null`\>; (`command`, `options`): `ChildProcessByStdio`\<`null`, `null`, `Readable`\>; (`command`, `options`): `ChildProcessByStdio`\<`null`, `null`, `null`\>; (`command`, `options`): `ChildProcess`; (`command`, `args?`, `options?`): `ChildProcessWithoutNullStreams`; (`command`, `args`, `options`): `ChildProcessByStdio`\<`Writable`, `Readable`, `Readable`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`Writable`, `Readable`, `null`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`Writable`, `null`, `Readable`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`null`, `Readable`, `Readable`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`Writable`, `null`, `null`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`null`, `Readable`, `null`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`null`, `null`, `Readable`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`null`, `null`, `null`\>; (`command`, `args`, `options`): `ChildProcess`; \} |

## Returns

[`OpCli`](/api/@graphorin/secret-1password/interfaces/OpCli.md)

## Stable
