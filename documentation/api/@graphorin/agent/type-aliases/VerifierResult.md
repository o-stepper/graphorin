[**Graphorin API reference v0.13.5**](../../../index.md)

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

Defined in: packages/agent/src/types.ts:488

**`Stable`**

Outcome of one [ResponseVerifier](/api/@graphorin/agent/interfaces/ResponseVerifier.md) check.
