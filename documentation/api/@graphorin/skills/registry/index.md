[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / registry

# registry

`SkillRegistry` - registry over loaded skills.

The registry is the surface the agent runtime (Phase 12) and the
standalone server (Phase 14) consume. It exposes:

- `getMetadata()` - every skill's Tier-1 metadata, used by the
  ContextEngine to assemble the system prompt's skill metadata
  block (Phase 10d).
- `activate(triggers)` / `getActivationRequest(triggers)` -
  match a list of trigger strings (slash commands and / or model-
  emitted skill names) and return the corresponding
  [ActivatedSkill](/api/@graphorin/skills/interfaces/ActivatedSkill.md) records.
- `getSkill(name)` - direct lookup.
- `tools()` - flat list of declared tool entries; the runtime
  resolves the actual `Tool[]` through the `@graphorin/tools`
  registry.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ActivationRequest](/api/@graphorin/skills/registry/interfaces/ActivationRequest.md) | Activation request produced by [SkillRegistry.resolveTrigger](/api/@graphorin/skills/registry/interfaces/SkillRegistry.md#resolvetrigger). |
| [ParsedActivationTrigger](/api/@graphorin/skills/registry/interfaces/ParsedActivationTrigger.md) | Parsed activation trigger. The registry uses this to discriminate slash-command activations (which override `disable-model-invocation: true`) from model-emitted auto activations (which honour it). |
| [RegisteredToolDeclaration](/api/@graphorin/skills/registry/interfaces/RegisteredToolDeclaration.md) | Tool-declaration record exposed by [SkillRegistry.toolDeclarations](/api/@graphorin/skills/registry/interfaces/SkillRegistry.md#tooldeclarations). Adds the owning skill's name and trust level so downstream registrations into `@graphorin/tools` can stamp the source. |
| [SkillRegistry](/api/@graphorin/skills/registry/interfaces/SkillRegistry.md) | Public registry surface. |
| [SkillRegistryOptions](/api/@graphorin/skills/registry/interfaces/SkillRegistryOptions.md) | Options accepted by [createSkillRegistry](/api/@graphorin/skills/registry/functions/createSkillRegistry.md). |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [SkillToolStamper](/api/@graphorin/skills/registry/type-aliases/SkillToolStamper.md) | Stamping seam injected by the agent runtime (Phase 12). It turns a skill's pre-built `Tool` into a fully resolved `ResolvedTool` (trust class + sandbox tier + source). The skills package keeps no hard dependency on `@graphorin/tools`; when no stamper is configured, `activate()` surfaces no tools (the runtime resolves them itself). |

## Functions

| Function | Description |
| ------ | ------ |
| [createSkillRegistry](/api/@graphorin/skills/registry/functions/createSkillRegistry.md) | Build a fresh, empty registry. Multiple registries can co-exist within a single process; the framework defaults to a single shared instance per agent instance. |
| [parseActivationTrigger](/api/@graphorin/skills/registry/functions/parseActivationTrigger.md) | Parse a single activation trigger. Slash-command bodies (`/skill:<name>`) are routed through the slash parser; bare names are treated as auto-activation requests emitted by the model. |

## References

### StampedSkillTool

Re-exports [StampedSkillTool](/api/@graphorin/skills/interfaces/StampedSkillTool.md)

***

### stampSkillTool

Re-exports [stampSkillTool](/api/@graphorin/skills/functions/stampSkillTool.md)

***

### stampSkillToolFromMetadata

Re-exports [stampSkillToolFromMetadata](/api/@graphorin/skills/functions/stampSkillToolFromMetadata.md)
