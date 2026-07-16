[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / AgentLike

# Interface: AgentLike\&lt;I, O\&gt;

Defined in: [packages/evals/src/types.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L31)

Agent shape consumed by the runner. Anything with a `run(input)`
method satisfies the contract - the framework's own `Agent` type
matches by structural typing.

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `I` |
| `O` |

## Methods

### run()

```ts
run(input, ctx?): Promise<O>;
```

Defined in: [packages/evals/src/types.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/types.ts#L32)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `I` |
| `ctx?` | \{ `signal?`: `AbortSignal`; \} |
| `ctx.signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;`O`\&gt;
