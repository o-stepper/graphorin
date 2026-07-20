[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / ResponseVerifier

# Interface: ResponseVerifier

Defined in: packages/agent/src/types.ts:504

**`Stable`**

A deterministic check over the model's terminal response. Runs
when the loop is about to complete; `ok: false` feeds `feedback` back
to the model (as a user message prefixed `[verifier:<id>]`) and the
loop continues for up to `AgentConfig.maxVerifierRounds` extra rounds.

A verifier that THROWS is treated as passed (the `verifier.result`
event still fires with `ok: true`): a buggy verifier must never
take down a run.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/agent/src/types.ts:505 |

## Methods

### verify()

```ts
verify(ctx): 
  | VerifierResult
| Promise<VerifierResult>;
```

Defined in: packages/agent/src/types.ts:506

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ctx` | \{ `output`: `string`; `state`: [`RunState`](/api/@graphorin/core/interfaces/RunState.md); `stepNumber`: `number`; \} | - |
| `ctx.output` | `string` | The model's terminal text output (raw, pre-structured-parse). |
| `ctx.state` | [`RunState`](/api/@graphorin/core/interfaces/RunState.md) | - |
| `ctx.stepNumber` | `number` | - |

#### Returns

  \| [`VerifierResult`](/api/@graphorin/agent/type-aliases/VerifierResult.md)
  \| `Promise`\&lt;[`VerifierResult`](/api/@graphorin/agent/type-aliases/VerifierResult.md)\&gt;
