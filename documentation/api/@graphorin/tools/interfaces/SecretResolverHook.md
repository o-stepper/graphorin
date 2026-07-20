[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / SecretResolverHook

# Interface: SecretResolverHook

Defined in: packages/tools/src/executor/tool-context.ts:47

**`Stable`**

Resolver hook the executor wires to the configured `SecretsStore` -
implementations call `resolve(key)` and either return the resolved
`SecretValue` or `null` when the key is absent.

## Methods

### resolve()

```ts
resolve(key): Promise<SecretValue | null>;
```

Defined in: packages/tools/src/executor/tool-context.ts:48

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

#### Returns

`Promise`\&lt;[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md) \| `null`\&gt;
