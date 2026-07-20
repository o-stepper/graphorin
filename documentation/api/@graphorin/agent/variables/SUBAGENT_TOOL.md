[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / SUBAGENT\_TOOL

# Variable: SUBAGENT\_TOOL

```ts
const SUBAGENT_TOOL: unique symbol;
```

Defined in: packages/agent/src/runtime/agent-to-tool.ts:79

Well-known marker on every `toTool()` tool object. The
graphorin tool-call walk detects it and executes the sub-agent
INLINE (through the same seam as a handoff) so a child suspending on
`awaiting_approval` parks on the parent instead of throwing from the
executor; the resume router resolves parked toTool sub-runs through
the same refs. `Symbol.for` so duplicate package copies agree.
Foreign harnesses mounting the tool outside the graphorin loop keep
the plain `execute()` behavior (a suspended child throws there).
