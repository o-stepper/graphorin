[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SandboxCode

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

Defined in: [packages/core/dist/contracts/sandbox.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/sandbox.d.ts)

Description of the code to run in the sandbox. Either a JS source
string, a path to a JS file, or a fully-qualified handler reference
resolved by the sandbox implementation.

## Stable
