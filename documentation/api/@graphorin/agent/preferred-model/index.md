[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / preferred-model

# preferred-model

Per-tool / per-agent preferred-model resolution. Pure functions
consulted by the agent loop AFTER the model has decided which
tool(s) to call but BEFORE `provider.stream(...)` is invoked.

The four-step precedence ladder (highest wins):

  1. `prepareStep({ provider })` - the operator's explicit per-step
     override always wins.
  2. `Tool.preferredModel`        - the tool author's per-tool hint.
     Only the tools the model actually CALLED on the previous step
     are consulted - an advertised-but-uncalled hint never
     escalates the run. Multi-tool ties resolve to the highest cost
     tier (`'smart' > 'balanced' > 'fast'`; explicit `ModelSpec` is
     treated as the highest tier).
  3. `Agent.preferredModel?`      - the per-agent default.
  4. `Agent` default `provider`   - the v0.1-alpha behaviour.

Cost-tier resolution against `Agent.modelTierMap` is documented
as a hint: when the requested tier is unmapped, the resolver
falls through to the next precedence step rather than throwing.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [PreferredModelResolution](/api/@graphorin/agent/preferred-model/interfaces/PreferredModelResolution.md) | Result returned by [resolvePreferredModel](/api/@graphorin/agent/preferred-model/functions/resolvePreferredModel.md). |
| [ResolvePreferredModelInput](/api/@graphorin/agent/preferred-model/interfaces/ResolvePreferredModelInput.md) | Pure inputs to [resolvePreferredModel](/api/@graphorin/agent/preferred-model/functions/resolvePreferredModel.md). |

## Functions

| Function | Description |
| ------ | ------ |
| [pickTopTierAcrossTools](/api/@graphorin/agent/preferred-model/functions/pickTopTierAcrossTools.md) | Pick the highest-cost tier across the supplied per-tool hints. Explicit `ModelSpec` entries are treated as the highest tier (`'smart'`) for tie-breaking - the conservative-correctness rule documented in DEC-169. |
| [resolvePreferredModel](/api/@graphorin/agent/preferred-model/functions/resolvePreferredModel.md) | Walk the precedence ladder and return the resolved provider for a single agent step. Pure function - no side effects. |
