[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/secret-1password](/api/@graphorin/secret-1password/index.md) / [](/api/@graphorin/secret-1password/README.md) / createDefaultOpCli

# Function: createDefaultOpCli()

```ts
function createDefaultOpCli(): OpCli;
```

Defined in: packages/secret-1password/src/op-cli.ts:115

**`Stable`**

Default [OpCli](/api/@graphorin/secret-1password/interfaces/OpCli.md) implementation. Spawns `op read --no-color
'&lt;uri&gt;'` with the configured timeout and inherits the parent
environment.

## Returns

[`OpCli`](/api/@graphorin/secret-1password/interfaces/OpCli.md)
