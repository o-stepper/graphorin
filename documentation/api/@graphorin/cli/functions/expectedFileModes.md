[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / expectedFileModes

# Function: expectedFileModes()

```ts
function expectedFileModes(home): Readonly<Record<string, number>>;
```

Defined in: packages/cli/src/commands/doctor.ts:255

**`Internal`**

Default expected file modes per the project's process-hardening
policy (DEC-135).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `home` | `string` |

## Returns

`Readonly`\<`Record`\&lt;`string`, `number`\&gt;\>
