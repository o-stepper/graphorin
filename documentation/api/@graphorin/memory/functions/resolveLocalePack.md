[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / resolveLocalePack

# Function: resolveLocalePack()

```ts
function resolveLocalePack(input, options?): ContextLocalePack;
```

Defined in: [packages/memory/src/context-engine/locale-packs/resolver.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/locale-packs/resolver.ts#L86)

Materialize a locale pack from a partial input + the English
fallback. Pure: no I/O outside the bounded WARN registry.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \| [`ContextLocalePack`](/api/@graphorin/memory/interfaces/ContextLocalePack.md) \| [`PartialContextLocalePack`](/api/@graphorin/memory/interfaces/PartialContextLocalePack.md) \| `undefined` |
| `options` | \{ `logger?`: [`LocaleResolverLogger`](/api/@graphorin/memory/interfaces/LocaleResolverLogger.md); `silent?`: `boolean`; \} |
| `options.logger?` | [`LocaleResolverLogger`](/api/@graphorin/memory/interfaces/LocaleResolverLogger.md) |
| `options.silent?` | `boolean` |

## Returns

[`ContextLocalePack`](/api/@graphorin/memory/interfaces/ContextLocalePack.md)

## Stable
