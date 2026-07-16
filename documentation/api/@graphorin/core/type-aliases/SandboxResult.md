[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SandboxResult

# Type Alias: SandboxResult\&lt;TOutput\&gt;

```ts
type SandboxResult<TOutput> = 
  | {
  durationMs: number;
  ok: true;
  output: TOutput;
}
  | {
  durationMs: number;
  error: {
     cause?: unknown;
     kind:   | "timeout"
        | "memory-exceeded"
        | "sandbox-violation"
        | "aborted"
        | "execution-failed";
     message: string;
  };
  ok: false;
};
```

Defined in: [packages/core/src/contracts/sandbox.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/sandbox.ts#L55)

Result of a sandboxed run. The shape mirrors the `ToolOutcome` union -
the runtime maps `SandboxResult` to `ToolOutcome` after the call.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Stable
