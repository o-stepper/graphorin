[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/secret-1password](/api/@graphorin/secret-1password/index.md) / [](/api/@graphorin/secret-1password/README.md) / createOpCli

# Function: createOpCli()

```ts
function createOpCli(deps?): OpCli;
```

Defined in: packages/secret-1password/src/op-cli.ts:133

**`Stable`**

[OpCli](/api/@graphorin/secret-1password/interfaces/OpCli.md) factory with an injectable `spawn` (for tests). Production
code uses [createDefaultOpCli](/api/@graphorin/secret-1password/functions/createDefaultOpCli.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | \{ `spawn?`: \{ (`command`, `options?`): `ChildProcessWithoutNullStreams`; (`command`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `Readable`, `Readable`\&gt;; (`command`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `Readable`, `null`\&gt;; (`command`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `null`, `Readable`\&gt;; (`command`, `options`): `ChildProcessByStdio`\&lt;`null`, `Readable`, `Readable`\&gt;; (`command`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `null`, `null`\&gt;; (`command`, `options`): `ChildProcessByStdio`\&lt;`null`, `Readable`, `null`\&gt;; (`command`, `options`): `ChildProcessByStdio`\&lt;`null`, `null`, `Readable`\&gt;; (`command`, `options`): `ChildProcessByStdio`\&lt;`null`, `null`, `null`\&gt;; (`command`, `options`): `ChildProcess`; (`command`, `args?`, `options?`): `ChildProcessWithoutNullStreams`; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `Readable`, `Readable`\&gt;; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `Readable`, `null`\&gt;; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `null`, `Readable`\&gt;; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`null`, `Readable`, `Readable`\&gt;; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `null`, `null`\&gt;; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`null`, `Readable`, `null`\&gt;; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`null`, `null`, `Readable`\&gt;; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`null`, `null`, `null`\&gt;; (`command`, `args`, `options`): `ChildProcess`; \}; \} |
| `deps.spawn?` | \{ (`command`, `options?`): `ChildProcessWithoutNullStreams`; (`command`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `Readable`, `Readable`\&gt;; (`command`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `Readable`, `null`\&gt;; (`command`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `null`, `Readable`\&gt;; (`command`, `options`): `ChildProcessByStdio`\&lt;`null`, `Readable`, `Readable`\&gt;; (`command`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `null`, `null`\&gt;; (`command`, `options`): `ChildProcessByStdio`\&lt;`null`, `Readable`, `null`\&gt;; (`command`, `options`): `ChildProcessByStdio`\&lt;`null`, `null`, `Readable`\&gt;; (`command`, `options`): `ChildProcessByStdio`\&lt;`null`, `null`, `null`\&gt;; (`command`, `options`): `ChildProcess`; (`command`, `args?`, `options?`): `ChildProcessWithoutNullStreams`; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `Readable`, `Readable`\&gt;; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `Readable`, `null`\&gt;; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `null`, `Readable`\&gt;; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`null`, `Readable`, `Readable`\&gt;; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`Writable`, `null`, `null`\&gt;; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`null`, `Readable`, `null`\&gt;; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`null`, `null`, `Readable`\&gt;; (`command`, `args`, `options`): `ChildProcessByStdio`\&lt;`null`, `null`, `null`\&gt;; (`command`, `args`, `options`): `ChildProcess`; \} |

## Returns

[`OpCli`](/api/@graphorin/secret-1password/interfaces/OpCli.md)
