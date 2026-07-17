[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/secret-1password](/api/@graphorin/secret-1password/index.md) / [](/api/@graphorin/secret-1password/README.md) / OpCli

# Interface: OpCli

Defined in: [packages/secret-1password/src/op-cli.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/secret-1password/src/op-cli.ts#L23)

## Stable

## Methods

### read()

```ts
read(uri, options?): Promise<OpCliReadResult>;
```

Defined in: [packages/secret-1password/src/op-cli.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/secret-1password/src/op-cli.ts#L30)

Resolve a single `op://...` reference. Returns the **trimmed**
stdout. Throws [OpCliError](/api/@graphorin/secret-1password/classes/OpCliError.md) when the binary is missing, the
user is signed out, the reference does not resolve, or the call
exceeds the timeout.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `uri` | `string` |
| `options?` | [`OpCliReadOptions`](/api/@graphorin/secret-1password/interfaces/OpCliReadOptions.md) |

#### Returns

`Promise`\&lt;[`OpCliReadResult`](/api/@graphorin/secret-1password/interfaces/OpCliReadResult.md)\&gt;
