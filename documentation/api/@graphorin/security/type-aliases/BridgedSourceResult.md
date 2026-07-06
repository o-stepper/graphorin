[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / BridgedSourceResult

# Type Alias: BridgedSourceResult

```ts
type BridgedSourceResult = 
  | {
  durationMs: number;
  ok: true;
  output: unknown;
  toolCalls: number;
}
  | {
  durationMs: number;
  error: {
     kind: "timeout" | "sandbox-violation" | "aborted" | "execution-failed";
     message: string;
  };
  ok: false;
  toolCalls: number;
};
```

Defined in: [packages/security/src/sandbox/bridged-source.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L90)

Outcome of a [runBridgedSource](/api/@graphorin/security/functions/runBridgedSource.md) run.

## Union Members

### Type Literal

```ts
{
  durationMs: number;
  ok: true;
  output: unknown;
  toolCalls: number;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `durationMs` | `number` | - | [packages/security/src/sandbox/bridged-source.ts:97](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L97) |
| `ok` | `true` | - | [packages/security/src/sandbox/bridged-source.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L92) |
| `output` | `unknown` | The script's final return value (structured-clone safe). | [packages/security/src/sandbox/bridged-source.ts:94](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L94) |
| `toolCalls` | `number` | Number of bridged tool calls the script made. | [packages/security/src/sandbox/bridged-source.ts:96](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L96) |

***

### Type Literal

```ts
{
  durationMs: number;
  error: {
     kind: "timeout" | "sandbox-violation" | "aborted" | "execution-failed";
     message: string;
  };
  ok: false;
  toolCalls: number;
}
```
