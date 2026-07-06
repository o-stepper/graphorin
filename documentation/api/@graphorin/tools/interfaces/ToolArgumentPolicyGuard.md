[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolArgumentPolicyGuard

# Interface: ToolArgumentPolicyGuard

Defined in: packages/tools/src/executor/types.ts:315

Structural adapter for the D4 tool-argument policy (Progent). The
agent runtime wires `evaluateToolArgumentPolicy` from
`@graphorin/security/policy`; `@graphorin/tools` stays dependency-free
on security.

## Stable

## Methods

### evaluate()

```ts
evaluate(input): 
  | {
  effect: "allow";
}
  | {
  effect: "forbid";
  reason: string;
};
```

Defined in: packages/tools/src/executor/types.ts:316

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | \{ `args`: `unknown`; `sensitive`: `boolean`; `sideEffectClass`: [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md); `toolName`: `string`; `trustClass`: [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md); \} | - |
| `input.args` | `unknown` | - |
| `input.sensitive` | `boolean` | - |
| `input.sideEffectClass` | [`SideEffectClass`](/api/@graphorin/core/type-aliases/SideEffectClass.md) | - |
| `input.toolName` | `string` | - |
| `input.trustClass` | [`ToolTrustClass`](/api/@graphorin/core/type-aliases/ToolTrustClass.md) | Trust class of the tool under evaluation (W-101) - lets guards enforce trust-taxonomy rules (Rule-of-Two `untrustedInput`). |

#### Returns

  \| \{
  `effect`: `"allow"`;
\}
  \| \{
  `effect`: `"forbid"`;
  `reason`: `string`;
\}
