[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / VerifierResult

# Type Alias: VerifierResult

```ts
type VerifierResult = 
  | {
  ok: true;
}
  | {
  feedback: string;
  ok: false;
};
```

Defined in: [packages/agent/src/types.ts:481](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L481)

Outcome of one [ResponseVerifier](/api/@graphorin/agent/interfaces/ResponseVerifier.md) check (C3).

## Stable
