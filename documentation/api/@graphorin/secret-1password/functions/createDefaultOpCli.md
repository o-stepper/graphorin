[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/secret-1password](/api/@graphorin/secret-1password/index.md) / createDefaultOpCli

# Function: createDefaultOpCli()

```ts
function createDefaultOpCli(): OpCli;
```

Defined in: packages/secret-1password/src/op-cli.ts:109

Default [OpCli](/api/@graphorin/secret-1password/interfaces/OpCli.md) implementation. Spawns `op read --no-color
--reveal '&lt;uri&gt;'` with the configured timeout and inherits the
parent environment.

## Returns

[`OpCli`](/api/@graphorin/secret-1password/interfaces/OpCli.md)

## Stable
