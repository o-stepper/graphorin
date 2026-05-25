[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SandboxResult

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

Defined in: packages/core/dist/contracts/sandbox.d.ts:53

Result of a sandboxed run. The shape mirrors the `ToolOutcome` union —
the runtime maps `SandboxResult` to `ToolOutcome` after the call.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Stable
