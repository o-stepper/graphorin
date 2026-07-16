[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SandboxKind

# Type Alias: SandboxKind

```ts
type SandboxKind = 
  | "none"
  | "worker-threads"
  | "isolated-vm"
  | "docker"
  | string & {
};
```

Defined in: [packages/security/src/sandbox/sandbox.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/sandbox.ts#L33)

Discriminator for the four built-in sandbox kinds. Custom adapters
may register additional kinds by declaring `(string & {})` literals
in user code.

## Stable
