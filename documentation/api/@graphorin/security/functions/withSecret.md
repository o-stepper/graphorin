[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / withSecret

# Function: withSecret()

```ts
function withSecret<T>(
   value, 
   fn, 
opts?): Promise<T>;
```

Defined in: packages/security/src/secrets/acl.ts:195

**`Stable`**

Run `fn` with the unwrapped value. Auto-wraps raw strings into a
`SecretValue` so callers migrating from raw-string APIs do not have
to wrap manually. Records a single audit event per scope.

## Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | \| `string` \| [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) |
| `fn` | (`raw`) => `T` \| `Promise`\&lt;`T`\&gt; |
| `opts` | \{ `caller?`: `string`; \} |
| `opts.caller?` | `string` |

## Returns

`Promise`\&lt;`T`\&gt;
