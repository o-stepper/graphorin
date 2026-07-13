[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / LateralLeakVector

# Type Alias: LateralLeakVector

```ts
type LateralLeakVector = 
  | "causality-laundering"
  | "commentary-phase"
  | "sideways-injection"
  | "protocol-header";
```

Defined in: [packages/core/src/types/agent-event.ts:534](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/agent-event.ts#L534)

Lateral-leak vector classification surfaced on
[AgentLateralLeakDetectedEvent.vector](/api/@graphorin/core/interfaces/AgentLateralLeakDetectedEvent.md#property-vector).

- `'causality-laundering'` - the assistant message references
  information about a denied earlier action via an indirect chain.
- `'commentary-phase'`     - operator-only commentary content was
  about to escape the session-output boundary.
- `'sideways-injection'`   - a low-trust child of an
  `Agent.fanOut(...)` `'judge-merge'` strategy contributed
  disproportionately to the merged output.
- `'protocol-header'`      - control-character bytes or a
  protocol-frame separator was about to escape one of the
  internal-service delivery boundaries.

## Stable
