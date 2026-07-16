[**Graphorin API reference v0.10.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [code-mode](/api/@graphorin/tools/code-mode/index.md) / CodeApiProjection

# Interface: CodeApiProjection

Defined in: [packages/tools/src/code-mode/project.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/project.ts#L45)

The projected code API for a set of tools.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-catalogue"></a> `catalogue` | `readonly` | `string` | Compact catalogue (name + one-line description, grouped by source). Cheap enough to embed in a tool description. | [packages/tools/src/code-mode/project.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/project.ts#L52) |
| <a id="property-names"></a> `names` | `readonly` | readonly `string`[] | Every callable tool name, in registration order. | [packages/tools/src/code-mode/project.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/project.ts#L47) |

## Methods

### search()

```ts
search(query, limit?): string;
```

Defined in: [packages/tools/src/code-mode/project.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/project.ts#L61)

Signature blocks for tools whose name or description contains
`query` (case-insensitive substring), capped at `limit` (default 10).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `string` |
| `limit?` | `number` |

#### Returns

`string`

***

### signatureFor()

```ts
signatureFor(name): string | undefined;
```

Defined in: [packages/tools/src/code-mode/project.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/project.ts#L54)

Full signature block for one tool, or `undefined` if unknown.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`string` \| `undefined`

***

### signaturesFor()

```ts
signaturesFor(names): string;
```

Defined in: [packages/tools/src/code-mode/project.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/code-mode/project.ts#L56)

Signature blocks for the given names (unknown names skipped).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `names` | readonly `string`[] |

#### Returns

`string`
