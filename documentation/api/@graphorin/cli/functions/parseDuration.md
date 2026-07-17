[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / parseDuration

# Function: parseDuration()

```ts
function parseDuration(input): number;
```

Defined in: [packages/cli/src/commands/token.ts:362](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/token.ts#L362)

**`Internal`**

Tiny duration parser. Accepts `Ns`, `Nm`, `Nh`, `Nd`. Returns
milliseconds. Throws on invalid input - surfaced as a fail-fast at
the CLI boundary.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` |

## Returns

`number`
