# tools-harness-tour

> A guided tour of the **graphorin** tools harness - an in-process **MCP server** bridged through `toTools()` into one `createToolRegistry({...})`, a **skills-loader** registration via `stampSkillTool({...})`, **defer-loading + `tool_search`** discovery, one **code-mode** (`code_execute`) call, and the **spill + `read_result`** large-result pipeline - all driven directly through `createToolExecutor({...})`, with no model in the loop.

This example is the smallest end-to-end demonstration of the tool plumbing every graphorin agent stands on. It wires the four tool sources the runtime knows (MCP-derived, skill-declared, first-party, built-in) into a single registry, then exercises the executor paths that matter in production: trust-class-aware inbound sanitization (MCP and untrusted-skill outputs come back inside the `<<<untrusted_content ...>>>` envelope), deferred-tool discovery, sandboxed programmatic tool calling, and the run-scoped spill-handle round trip for >100 KB results.

CI exercises the tour fully offline - the MCP server lives in the same process on an `InMemoryTransport` linked pair, so there is no network, no child process, no daemon, and no API key. The example tracks the workspace version (lockstep with every other `@graphorin/*` package).

---

## Prerequisites

- **Node.js 22.12+** (the workspace pins `>=22.12.0`).
- **pnpm 10.28+** (`corepack enable && corepack prepare pnpm@10.28.2 --activate`).

No LLM provider is needed: the tour exercises the tool harness, not a model.

---

## Quick start

From the workspace root:

```bash
pnpm install
pnpm --filter ./examples/tools-harness-tour build
pnpm --filter ./examples/tools-harness-tour test
```

Run the tour:

```bash
pnpm --filter ./examples/tools-harness-tour dev
```

Expected output (one line per stage, then the summary line):

```
[1/6] mcp-server: 3 deterministic tools on an in-memory linked-pair transport (large payload 123047 bytes)
[2/6] mcp-client: adapted 3 tools via toTools() (server='tour-mcp'); lookup_city('kyiv') returned 148 chars (untrusted-wrapped)
[3/6] skill: 'offline-notes' (trust=untrusted, declared tools=1, description="Look up short bundled release notes about the Graphorin tools harness."); registered 'note_lookup'
[4/6] tool_search: 'convert kilometers to meters' -> 1 deferred hit(s): unit_convert
[5/6] code-mode: sandboxed script bridged 2 tool calls -> chars=28, meters=28000
[6/6] spill: handle graphorin-spill:tour-run/call-5-render_atlas.txt (123047 bytes spilled); read_result paged it back in 4 page(s), first page 32768 bytes
graphorin v0.12.1 tools-harness-tour: OK - tools=10 deferred=1 searchHits=1 spillBytes=123047 pagesRead=4
```

---

## Stage 1 - an in-process MCP server

`src/mcp-server.ts` builds an SDK `Server` bound to one half of an `InMemoryTransport.createLinkedPair()` (mirroring the fixture graphorin's own MCP test suite uses). The other half is handed to the client, so the whole MCP protocol runs in one process with no wire:

```ts
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const server = new Server(
  { name: 'tools-harness-tour-server', version: '1.0.0' },
  { capabilities: { tools: {} } },
);
// ListToolsRequestSchema / CallToolRequestSchema handlers, then:
await server.connect(serverTransport);
```

The catalogue is three deterministic tools: `lookup_city` (constant-table lookup), `count_cities`, and `render_atlas` - the last one returns a >100 KB arithmetically derived text payload so the spill stage always fires.

## Stage 2 - MCP client `toTools()` into the registry

`src/mcp-client.ts` connects an SDK `Client` over the linked pair and exposes graphorin's `MCPClient` surface. One deliberate deviation from production code is documented in the file: `createMCPClient({...})` always *builds* its transport from an `MCPTransportConfig` (stdio child / HTTP dial), and the internal seam that accepts a pre-built transport (`createMCPClientFromSdkTransport`) is `@internal` and not re-exported through the package's `exports` map. The tour therefore composes the same public bridge parts the real client delegates to - `deriveServerIdentity(...)` (operator-controlled identity, W-016) and `adaptMCPTools(...)` (sanitized descriptions/schemas, defer-loading resolution, definition fingerprints, `execute()` round-tripping through `callTool`).

```ts
const client = await connectTourMcpClient({ transport, serverInfoName: 'tour-mcp' });
const mcpTools = await client.toTools({
  maxResultTokens: 256,
  truncationStrategy: 'spill-to-file',
});
for (const adapted of mcpTools) {
  registry.register(adapted, { kind: 'mcp', serverIdentity: client.id });
}
```

Because the tools register with an `mcp` source, they carry the `mcp-derived` trust class: their results come back wrapped in the untrusted-content envelope, and anything they spill stays tainted (stage 6).

## Stage 3 - skills loader + `stampSkillTool`

`assets/skills/offline-notes/SKILL.md` is a complete skill folder: frontmatter with `name`, `description`, `graphorin-trust-level: untrusted`, a `graphorin-handoff-input-filter`, and a `graphorin-tools:` declaration for `note_lookup`. The loader parses and validates the frontmatter (Tier-1 metadata card, always available without reading the body); the example materialises the declared tool in TypeScript and stamps it, exactly like the agent runtime does:

```ts
const skill = await loadSkillFromSource({ kind: 'folder', path: skillDir });
const stamped = stampSkillTool(noteLookupTool, skill);
registry.register(stamped.tool, stamped.source);
```

`stampSkillTool({...})` derives the `{ kind: 'skill', trustLevel: 'untrusted' }` source, forces the sandbox tier, and defaults the inbound-sanitization policy to `'detect-and-strip-and-wrap'` - so the skill tool's output also arrives enveloped. Note the loader caps a folder skill's self-declared trust: `graphorin-trust-level: trusted` in a downloaded SKILL.md resolves to `unknown` (RP-9); trust is granted by the integrator, never by the artifact.

## Stage 4 - defer-loading + `tool_search`

`unit_convert` registers with `defer_loading: true`, so it stays out of the per-step catalogue until discovered. Because the registry now holds a deferred pool, the tour registers the built-in `tool_search` (the same trigger rule the agent runtime applies) and executes it through the executor:

```ts
registry.register(createToolSearchTool({ registry }), {
  kind: 'built-in',
  subsystem: 'tool-discovery',
});
const search = await executor.executeOne({
  call: { toolCallId: 'call-4', toolName: 'tool_search', args: { query: 'convert kilometers to meters' } },
  runContext,
  stepNumber: 4,
});
```

With no embedder configured, the three-tier ranking chain falls through semantic search to BM25, which matches `unit_convert` on its description.

## Stage 5 - one code-mode call

The two code-mode meta-tools register the way the agent wires them: the projection covers eager tools only (progressive disclosure - `code_search` folds deferred matches on demand), and every in-script `tools.<name>(args)` call bridges back through `executor.executeOne(...)`, so per-tool validation, sanitization, and truncation still apply inside a script. The script runs in an isolated worker thread; only its final `return` value comes back:

```ts
const source = [
  "const counted = await tools.char_count({ text: 'graphorin tools harness tour' });",
  "const converted = await tools.unit_convert({ value: counted.count, from: 'km', to: 'm' });",
  'return { chars: counted.count, meters: converted.value };',
].join('\n');
```

Note the script calls the *deferred* `unit_convert` - deferral gates advertisement, not execution.

## Stage 6 - spill + `read_result`

`render_atlas` returns >100 KB while its adapted `maxResultTokens` is 256, so the `'spill-to-file'` strategy writes the full body under `<spillRoot>/<runId>/<toolCallId>.txt` and the outcome carries an opaque, run-scoped `resultHandle` instead of the blob:

```ts
const atlas = expectOk(await executor.executeOne({ call: renderAtlasCall, runContext, stepNumber: 5 }));
atlas.resultHandle;
// { uri: 'graphorin-spill:tour-run/call-5-render_atlas.txt',
//   kind: 'spill-file', bytes: 123047, producerTrustClass: 'mcp-derived', ... }
```

The built-in `read_result` (bound to a `createFileResultReader({...})` over the SAME artifact root the spill writer used) then pages the artifact back by byte range until `eof`. Two properties worth noticing:

- **Run-scoped handles.** Spill handles embed the producing `runId`; reads from another run are denied by default (`allowCrossRun` is a deliberate opt-in). The tour reads under the same `runId` it spilled from.
- **Producer taint survives the round trip.** The artifact was produced by an `mcp-derived` tool, so each page read through the trusted `read_result` built-in is re-sanitized under the *producer's* trust class - an untrusted spill cannot launder to trusted through the reader.

---

## Project layout

```
examples/tools-harness-tour/
├── assets/
│   └── skills/offline-notes/SKILL.md   # Bundled skill folder (frontmatter + body)
├── src/
│   ├── main.ts          # runTour({...}), the six-stage flow, CLI entry
│   ├── mcp-server.ts    # In-process MCP server on the linked-pair transport
│   ├── mcp-client.ts    # MCPClient facade over the public adaptMCPTools bridge
│   ├── run-context.ts   # Minimal RunContext stand-in (no agent loop)
│   └── skill.ts         # Skill loading + note_lookup materialisation
├── tests/
│   └── smoke.test.ts    # vitest coverage (offline; asserts every stage invariant)
├── CHANGELOG.md
├── package.json
├── tsconfig.json
├── tsdown.config.ts
└── vitest.config.ts
```

## Troubleshooting

- **`tool_search did not surface the deferred 'unit_convert' tool`** - the deferred pool is empty; make sure `unit_convert` still registers with `defer_loading: true` before `createToolSearchTool({ registry })`.
- **`render_atlas did not spill - no resultHandle on the outcome`** - the adapted tools lost their per-server `truncationStrategy: 'spill-to-file'` / `maxResultTokens: 256` options, or the payload shrank below the cap.
- **`read_result ... cross-run reads are disabled`** - the page read ran under a different `runId` than the spill; the tour must read within the same run (or you must opt into `allowCrossRun` on `createReadResultTool({...})`).
- **`code_execute failed (...)`** - the sandbox blocks network/filesystem access by design; scripts may only reach the world through the bridged `tools` object.

---

## Observability

Set **`GRAPHORIN_TRACE=console`** for terminal span export via `@graphorin/example-trace-helper` - the tour threads the tracer into its `RunContext`, so every `tool.execute` span prints. Full notes: [`TRACING.md`](../TRACING.md).

---

**Graphorin** · v0.12.1 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
