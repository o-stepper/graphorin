[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SandboxCode

# Type Alias: SandboxCode

```ts
type SandboxCode = 
  | {
  filename?: string;
  kind: "source";
  source: string;
}
  | {
  kind: "file";
  path: string;
}
  | {
  export: string;
  kind: "handler";
  module: string;
};
```

Defined in: packages/core/src/contracts/sandbox.ts:24

Description of the code to run in the sandbox. Either a JS source
string, a path to a JS file, or a fully-qualified handler reference
resolved by the sandbox implementation.

## Stable
