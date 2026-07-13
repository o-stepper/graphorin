[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / composeGuardrails

# Function: composeGuardrails()

```ts
function composeGuardrails<TValue>(
   guardrails, 
   value, 
ctx): Promise<ComposedGuardrailResult<TValue>>;
```

Defined in: [packages/security/src/guardrails/builders.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guardrails/builders.ts#L58)

Compose a sequence of guardrails into a single check that runs
them in order. The first `'block'` short-circuits; `'warn'` is
accumulated; `'rewrite'` mutates the in-flight value and continues
forward.

The composer never throws: every error path returns
`ComposedGuardrailResult` so the caller can surface structured
results without exception handling.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TValue` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `guardrails` | readonly [`GuardrailDefinition`](/api/@graphorin/security/interfaces/GuardrailDefinition.md)\&lt;`TValue`\&gt;[] |
| `value` | `TValue` |
| `ctx` | [`GuardrailContext`](/api/@graphorin/security/interfaces/GuardrailContext.md) |

## Returns

`Promise`\<[`ComposedGuardrailResult`](/api/@graphorin/security/type-aliases/ComposedGuardrailResult.md)\&lt;`TValue`\&gt;\>

## Stable
