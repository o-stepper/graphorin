[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / event

# Function: event()

```ts
function event(
   id, 
   eventName, 
   callback, 
   options?): TriggerDeclaration;
```

Defined in: packages/triggers/src/index.ts:225

**`Stable`**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `eventName` | `string` |
| `callback` | [`TriggerCallback`](/api/@graphorin/triggers/type-aliases/TriggerCallback.md) |
| `options` | [`TriggerOptions`](/api/@graphorin/triggers/interfaces/TriggerOptions.md) |

## Returns

[`TriggerDeclaration`](/api/@graphorin/triggers/interfaces/TriggerDeclaration.md)
