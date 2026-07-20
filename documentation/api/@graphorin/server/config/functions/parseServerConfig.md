[**Graphorin API reference v0.13.4**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [config](/api/@graphorin/server/config/index.md) / parseServerConfig

# Function: parseServerConfig()

```ts
function parseServerConfig(input): ServerConfigSpec;
```

Defined in: packages/server/src/config.ts:494

**`Stable`**

Parse + validate user input. Returns a strongly-typed
[ServerConfigSpec](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md); throws [ConfigInvalidError](/api/@graphorin/server/errors/classes/ConfigInvalidError.md) on
any invalid field with a flattened issue list.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `unknown` |

## Returns

[`ServerConfigSpec`](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md)
