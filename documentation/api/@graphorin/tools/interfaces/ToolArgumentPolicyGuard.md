[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolArgumentPolicyGuard

# Interface: ToolArgumentPolicyGuard

Defined in: packages/tools/src/executor/types.ts:347

**`Stable`**

Structural adapter for the tool-argument policy (Progent-style). The
agent runtime wires `evaluateToolArgumentPolicy` /
`evaluatePermissionDecision` from `@graphorin/security/policy`;
`@graphorin/tools` stays dependency-free on security.

## Methods

### decide()?

```ts
optional decide(input): 
  | {
  effect: "allow";
}
  | {
  effect: "deny" | "ask" | "defer";
  reason: string;
};
```

Defined in: packages/tools/src/executor/types.ts:358

Four-value evaluation (`deny > defer > ask > allow`). When
present the executor's policy phase prefers it over the binary
`evaluate`; `ask`/`defer` verdicts fail closed at the executor
unless the batch is pre-approved (only the agent pre-screen can
suspend a run).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ToolArgumentPolicyFacts`](/api/@graphorin/tools/interfaces/ToolArgumentPolicyFacts.md) |

#### Returns

  \| \{
  `effect`: `"allow"`;
\}
  \| \{
  `effect`: `"deny"` \| `"ask"` \| `"defer"`;
  `reason`: `string`;
\}

***

### deniesName()?

```ts
optional deniesName(toolName): 
  | {
  denied: false;
}
  | {
  denied: true;
  reason: string;
};
```

Defined in: packages/tools/src/executor/types.ts:370

Deny-by-name: advertise-time check consulted with NO args (the
per-step catalogue filter, `tool_search` exclusion and the
executor's early mirror). Implementations must honour only
predicate-free deny rules so the answer is deterministic for a
given name.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `toolName` | `string` |

#### Returns

  \| \{
  `denied`: `false`;
\}
  \| \{
  `denied`: `true`;
  `reason`: `string`;
\}

***

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

Defined in: packages/tools/src/executor/types.ts:348

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ToolArgumentPolicyFacts`](/api/@graphorin/tools/interfaces/ToolArgumentPolicyFacts.md) |

#### Returns

  \| \{
  `effect`: `"allow"`;
\}
  \| \{
  `effect`: `"forbid"`;
  `reason`: `string`;
\}
