[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / canonicalJson

# Function: canonicalJson()

```ts
function canonicalJson(value): string;
```

Defined in: packages/security/src/audit/canonical-json.ts:25

**`Stable`**

Serialise `value` into the framework's canonical JSON byte sequence.
The result is a UTF-8-safe string suitable for SHA-256 hashing.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

## Returns

`string`
