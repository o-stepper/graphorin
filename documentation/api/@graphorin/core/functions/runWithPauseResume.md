[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / runWithPauseResume

# Function: runWithPauseResume()

```ts
function runWithPauseResume<R>(value, fn): Promise<R>;
```

Defined in: packages/core/src/channels/pause.ts:63

**`Internal`**

Run `fn` inside a scope where the next `pause(...)` call returns the
supplied `value` instead of throwing a fresh [PauseSignal](/api/@graphorin/core/classes/PauseSignal.md).

This helper is the contract between the runtime and `pause(...)`.
Consumers of `pause(...)` never call it directly — only the workflow
engine wires it up around the resumed node body.

## Type Parameters

| Type Parameter |
| ------ |
| `R` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |
| `fn` | () => `R` \| `Promise`\&lt;`R`\&gt; |

## Returns

`Promise`\&lt;`R`\&gt;
