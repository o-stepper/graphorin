[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / runWithPauseResume

# Function: runWithPauseResume()

```ts
function runWithPauseResume<R>(
   values, 
   fn, 
meta?): Promise<R>;
```

Defined in: packages/core/src/channels/pause.ts:157

**`Internal`**

Run `fn` inside a scope where successive `pause(...)` calls return the
supplied `values` in order instead of throwing a fresh
[PauseSignal](/api/@graphorin/core/classes/PauseSignal.md) (a node body re-executes from the top on
every resume, so earlier pauses must replay their already-delivered
values and only the FIRST unsatisfied `pause()` suspends again). An
empty `values` array behaves exactly like no scope - every `pause()`
suspends - which is what a static-gate resume needs so a programmatic
`pause()` inside the node is never silently satisfied.

This helper is the contract between the runtime and `pause(...)`.
Consumers of `pause(...)` never call it directly - only the workflow
engine wires it up around the resumed node body.

## Type Parameters

| Type Parameter |
| ------ |
| `R` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `values` | readonly `unknown`[] |
| `fn` | () => `R` \| `Promise`\&lt;`R`\&gt; |
| `meta?` | readonly ( \| [`PauseIdentity`](/api/@graphorin/core/interfaces/PauseIdentity.md) \| `null` \| `undefined`)[] |

## Returns

`Promise`\&lt;`R`\&gt;
