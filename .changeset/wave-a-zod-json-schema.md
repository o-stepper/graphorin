---
'@graphorin/tools': patch
'@graphorin/agent': patch
'@graphorin/mcp': patch
---

Fix critical tool-schema wire bug (tools-01): plain Zod schemas were never converted to JSON Schema, so OpenAI-shaped/Ollama/vercel providers received `{"_def":...}` internals as tool `parameters` and MCP tools serialized to `{}`. Adds a shared structural Zod v3/v4 to JSON Schema converter (`@graphorin/tools/schema`, no new dependencies) used by the agent's `toolToDefinition`, the code-mode signature projection, and `ToolSearchMatch`; MCP's `buildJsonSchemaValidator` now retains the source JSON Schema and exposes it via `toJSON()`. Unprojectable schemas degrade loudly (WARN + permissive `{}`) instead of shipping serialized validator internals.
