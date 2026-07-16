[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ToolArgumentPolicyGuard

# Interface: ToolArgumentPolicyGuard

Defined in: [packages/tools/src/executor/types.ts:348](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L348)

Structural adapter for the D4 tool-argument policy (Progent). The
agent runtime wires `evaluateToolArgumentPolicy` /
`evaluatePermissionDecision` from `@graphorin/security/policy`;
`@graphorin/tools` stays dependency-free on security.

## Stable

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

Defined in: [packages/tools/src/executor/types.ts:359](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L359)

E1: four-value evaluation (`deny > defer > ask > allow`). When
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

Defined in: [packages/tools/src/executor/types.ts:371](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L371)

E1 deny-by-name: advertise-time check consulted with NO args (the
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

Defined in: [packages/tools/src/executor/types.ts:349](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/executor/types.ts#L349)

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
