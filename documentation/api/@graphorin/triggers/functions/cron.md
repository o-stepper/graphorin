[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / cron

# Function: cron()

```ts
function cron(
   id, 
   expression, 
   callback, 
   options?): TriggerDeclaration;
```

Defined in: [packages/triggers/src/index.ts:170](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L170)

Build a cron trigger declaration. The expression is validated
eagerly - a malformed cron expression throws at registration time,
not at first fire.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `expression` | `string` |
| `callback` | [`TriggerCallback`](/api/@graphorin/triggers/type-aliases/TriggerCallback.md) |
| `options` | [`TriggerOptions`](/api/@graphorin/triggers/interfaces/TriggerOptions.md) |

## Returns

[`TriggerDeclaration`](/api/@graphorin/triggers/interfaces/TriggerDeclaration.md)

## Stable
