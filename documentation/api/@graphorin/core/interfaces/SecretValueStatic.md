[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SecretValueStatic

# Interface: SecretValueStatic

Defined in: packages/core/src/contracts/secret-value.ts:98

**`Stable`**

Static helpers expected on every concrete `SecretValue` constructor.

## Methods

### fromBuffer()

```ts
fromBuffer(buf, opts?): SecretValue;
```

Defined in: packages/core/src/contracts/secret-value.ts:106

Construct from a Node.js `Buffer`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `buf` | `Buffer` |
| `opts?` | [`SecretValueOptions`](/api/@graphorin/core/interfaces/SecretValueOptions.md) |

#### Returns

[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md)

***

### fromString()

```ts
fromString(raw, opts?): SecretValue;
```

Defined in: packages/core/src/contracts/secret-value.ts:104

Construct from a plain string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `string` |
| `opts?` | [`SecretValueOptions`](/api/@graphorin/core/interfaces/SecretValueOptions.md) |

#### Returns

[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md)

***

### isSecretValue()

```ts
isSecretValue(value): value is SecretValue;
```

Defined in: packages/core/src/contracts/secret-value.ts:100

Cross-realm safe type guard.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

#### Returns

`value is SecretValue`

***

### timingSafeEquals()

```ts
timingSafeEquals(a, b): boolean;
```

Defined in: packages/core/src/contracts/secret-value.ts:102

Constant-time equality.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `a` | [`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md) |
| `b` | [`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md) |

#### Returns

`boolean`
