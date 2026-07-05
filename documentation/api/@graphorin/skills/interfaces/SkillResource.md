[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / SkillResource

# Interface: SkillResource

Defined in: packages/skills/src/types/index.ts:253

Lazy resource accessor returned by [Skill.resources](/api/@graphorin/skills/interfaces/Skill.md#resources). The
loader does not read the file off disk until `.read()` is invoked.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-mediatype"></a> `mediaType?` | `readonly` | `string` | packages/skills/src/types/index.ts:256 |
| <a id="property-path"></a> `path` | `readonly` | `string` | packages/skills/src/types/index.ts:254 |
| <a id="property-relativepath"></a> `relativePath` | `readonly` | `string` | packages/skills/src/types/index.ts:255 |

## Methods

### read()

```ts
read(signal?): Promise<Uint8Array<ArrayBufferLike>>;
```

Defined in: packages/skills/src/types/index.ts:257

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `signal?` | `AbortSignal` |

#### Returns

`Promise`\<`Uint8Array`\&lt;`ArrayBufferLike`\&gt;\>

***

### readText()

```ts
readText(signal?): Promise<string>;
```

Defined in: packages/skills/src/types/index.ts:258

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;`string`\&gt;
