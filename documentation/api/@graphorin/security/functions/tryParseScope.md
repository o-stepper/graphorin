[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / tryParseScope

# Function: tryParseScope()

```ts
function tryParseScope(input): 
  | ParsedScope
  | undefined;
```

Defined in: [packages/security/src/auth/scope.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/auth/scope.ts#L83)

Try-parse helper. Returns `undefined` on failure rather than
throwing; useful when iterating over a granted set that may include
legacy strings.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `string` |

## Returns

  \| [`ParsedScope`](/api/@graphorin/security/type-aliases/ParsedScope.md)
  \| `undefined`

## Stable
