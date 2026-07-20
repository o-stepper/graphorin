[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / LocaleResolverLogger

# Interface: LocaleResolverLogger

Defined in: packages/memory/src/context-engine/locale-packs/resolver.ts:43

**`Stable`**

Logger surface accepted by [resolveLocalePack](/api/@graphorin/memory/functions/resolveLocalePack.md). Every other
surface in the codebase already accepts `Logger | undefined`; this
one mirrors that contract without taking the heavier
`@graphorin/core` `Logger` import directly.

## Methods

### warn()

```ts
warn(message, attrs?): void;
```

Defined in: packages/memory/src/context-engine/locale-packs/resolver.ts:44

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `message` | `string` |
| `attrs?` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> |

#### Returns

`void`
