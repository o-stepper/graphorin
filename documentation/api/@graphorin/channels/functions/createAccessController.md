[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / createAccessController

# Function: createAccessController()

```ts
function createAccessController(options): ChannelAccessController;
```

Defined in: packages/channels/src/access.ts:155

**`Stable`**

Build a deterministic access controller. Throws
[ChannelAccessConfigError](/api/@graphorin/channels/classes/ChannelAccessConfigError.md) when `'pairing'` lacks a store or
`'allowlist'` lacks entries - fail-closed at construction.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateAccessControllerOptions`](/api/@graphorin/channels/interfaces/CreateAccessControllerOptions.md) |

## Returns

[`ChannelAccessController`](/api/@graphorin/channels/interfaces/ChannelAccessController.md)
