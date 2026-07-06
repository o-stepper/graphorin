---
layout: home
title: Graphorin documentation
titleTemplate: Guides, examples, and API reference

hero:
  name: Graphorin
  text: A TypeScript framework for long-living personal AI assistants.
  tagline: "Six-tier memory, checkpointed workflows that survive restarts, typed tools with Agent Skills and MCP, OpenTelemetry traces for every model and tool call, and secret handling with a tamper-evident audit chain. Local-first and private by default: nothing leaves your process unless your code sends it. Embed in Node.js today; add the standalone server when you need REST, WebSocket, and triggers."
  image:
    src: /logo.svg
    alt: Graphorin
  actions:
    - theme: brand
      text: Get started
      link: /guide/quickstart
    - theme: alt
      text: What is Graphorin?
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/o-stepper/graphorin

features:
  - title: Private by default
    details: No hidden analytics or version checks. Your process only talks to the network when your code does. CI blocks accidental "phone home" changes so the default stays honest.
    link: /guide/privacy
    linkText: Read the promise

  - title: Six memory layers
    details: Working, session, episodic, semantic, procedural, and shared tiers - each tuned for how fast it changes, how it is searched, and who may read or write it - not a single lump of "context."
    link: /guide/memory-system
    linkText: Memory system

  - title: Workflows that keep going
    details: Checkpointed steps, pause and resume across restarts, human approvals, and parallelism when you need it. A run can stop on Friday and continue on another machine on Monday.
    link: /guide/workflow-engine
    linkText: Workflow engine

  - title: One API, many models
    details: Switch between cloud SDKs, local Ollama, OpenAI-compatible servers, llama.cpp, or GGUF without rewriting your agent - the same provider surface everywhere.
    link: /guide/providers
    linkText: Providers

  - title: Observability built in
    details: OpenTelemetry-friendly traces for models, tools, memory, and workflows, with redaction so sensitive fields are less likely to leak to your exporter by mistake.
    link: /guide/observability
    linkText: Observability

  - title: Tools, Skills, and MCP
    details: Typed tools, standard Agent Skills packs, and a built-in MCP client for stdio and Streamable HTTP - so your assistant can reach the systems you already rely on.
    link: /guide/tools
    linkText: External surface

  - title: Embed or run a server
    details: Use Graphorin inside your Node.js app today, then add the standalone server when you want REST, WebSocket, SSE, triggers, and replay without a rewrite.
    link: /guide/standalone-server
    linkText: Standalone server

  - title: Safer secrets and audit trail
    details: "`SecretValue` and `SecretRef` keep credentials out of logs, keychain-friendly resolution, optional encryption at rest, OAuth with PKCE, and a tamper-evident audit chain."
    link: /guide/secrets
    linkText: Secrets

  - title: Strict TypeScript end to end
    details: "Public APIs avoid `any`; schemas line up across tools, memory, and outputs; streaming events stay typed so large teams catch mistakes early."
    link: /api/
    linkText: API reference
---

<div style="text-align: center; margin: 2rem 0; opacity: 0.85;">
  <FrameworkBadge />
</div>
