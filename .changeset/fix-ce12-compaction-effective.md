---
'@graphorin/memory': patch
---

fix(memory): surface compaction enabled-but-ineffective instead of silently no-op'ing (CE-12)

Auto-compaction is **on by default** for cloud-tier providers, but neither the
agent factory nor the memory facade supplies `providerContextWindow`
automatically. Without it the trigger threshold resolves to `Infinity`, so
`shouldCompact` returns `false` forever — the default-on protection was a silent
no-op — while `config()` still reported `compactionEnabled: true`.

The context engine now refuses to hide that: at resolution it **warns once**
when compaction is on by the default trust policy but no window was supplied,
and **throws** when the operator configured `compaction: {...}` explicitly
without one. `ResolvedContextEngineConfig` gains a `compactionEffective` flag
(`compactionEnabled && providerContextWindow !== null`) for honest
introspection. Auto-detecting the window from the provider remains a follow-up.
Documents the requirement in the agent-runtime guide.
