[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / defineLocalePack

# Function: defineLocalePack()

```ts
function defineLocalePack(input): LocalePack;
```

Defined in: [packages/memory/src/conflict/locale-packs/types.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/locale-packs/types.ts#L102)

Builder used by application code that wants to ship a custom pack:

```ts
const ru = defineLocalePack({
  id: 'ru',
  supersedeMarkers: [{ regex: /\bпереехал\b/iu, kind: 'location' }],
  negationMarkers: [{ regex: /\bне\b/iu }],
  predicateNormalisers: ['жив', 'жил', 'живёт'],
  subjectStopWords: ['я', 'ты'],
});
```

The builder freezes every input so the pack can be safely reused
across multiple `Memory` instances without accidental mutation.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`LocalePack`](/api/@graphorin/memory/interfaces/LocalePack.md) |

## Returns

[`LocalePack`](/api/@graphorin/memory/interfaces/LocalePack.md)

## Stable
