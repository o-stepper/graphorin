[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolSecretsAccessor

# Interface: ToolSecretsAccessor

Defined in: packages/core/src/contracts/tool.ts:382

**`Stable`**

Per-call secrets accessor surface. Implemented by the executor; the
tool author calls `require(...)` to obtain a `SecretValue` wrapper.

The accessor is intentionally narrow - the ACL enforcement happens
inside `require(...)`, so the tool author never accidentally
unwraps a secret outside the tool's permitted set.

## Methods

### require()

#### Call Signature

```ts
require(key, options?): Promise<SecretValue>;
```

Defined in: packages/core/src/contracts/tool.ts:389

Resolve a secret by key. Throws `SecretAccessDeniedError` if the
key is not in the tool's `secretsAllowed` allowlist; throws
`SecretRequiredError` (or returns `null` when `optional: true`)
if the key resolves to no value.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `options?` | \{ `optional?`: `false`; \} |
| `options.optional?` | `false` |

##### Returns

`Promise`\&lt;[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md)\&gt;

#### Call Signature

```ts
require(key, options): Promise<SecretValue | null>;
```

Defined in: packages/core/src/contracts/tool.ts:393

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `options` | \{ `optional`: `true`; \} |
| `options.optional` | `true` |

##### Returns

`Promise`\&lt;[`SecretValue`](/api/@graphorin/core/interfaces/SecretValue.md) \| `null`\&gt;
