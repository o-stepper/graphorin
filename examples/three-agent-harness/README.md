# three-agent-harness

> A canonical **Planner / Generator / Evaluator** orchestration template for **graphorin** - three `createAgent({...})` calls wired through `evaluatorOptimizer({...})` with structured-handoff artifacts (`agent.progress.write/read`) that survive process restart, plus an opt-in `Agent.fanOut({...})` research-and-decide variant with a minimal `createCitationAgent({...})` post-processing step.

This example is the smallest end-to-end demonstration of the multi-agent loop most production agent stacks reinvent: a Planner expands a request into a phased plan, a Generator implements the next unfinished phase, an Evaluator scores the candidate against a rubric, and the loop self-revises until the rubric passes (or the iteration cap fires). A second variant fans the Generator out into N parallel research sub-agents and folds the per-source claims back through a citation step.

CI exercises the harness against a deterministic stub provider - no API keys, no daemon, no network - so the smoke suite stays well under 30 seconds.

---

## Prerequisites

- **Node.js 22.12+** (the workspace pins `>=22.12.0`).
- **pnpm 10.28+** (`corepack enable && corepack prepare pnpm@10.28.2 --activate`).
- **Optional** - a local [Ollama](https://ollama.com/) daemon listening on `http://127.0.0.1:11434` if you want the `recipe: 'ollama'` swap-in.

The default recipe (`'stub'`) needs neither the daemon nor any model file.

---

## Quick start

From the workspace root:

```bash
pnpm install
pnpm --filter ./examples/three-agent-harness build
pnpm --filter ./examples/three-agent-harness test
```

Run the LRU-cache harness against the stub provider:

```bash
pnpm --filter ./examples/three-agent-harness dev
```

Expected output (artifact root defaults to `./.graphorin/three-agent-harness`):

```
graphorin v0.13.13 three-agent-harness - recipe='stub', runId='harness_..._...', termination='pass', iterations=1, finalScore=9.
```

Add the research-and-decide variant on top:

```bash
GRAPHORIN_HARNESS_VARIANT=research-and-decide \
  pnpm --filter ./examples/three-agent-harness dev
```

```
graphorin v0.13.13 three-agent-harness research-and-decide - children=3, bound=3, unbound=0.
```

---

## The Planner / Generator / Evaluator template

Three plain `createAgent({...})` calls, distinguished by their `instructions` strings - that is the entire pattern. The harness wires them together with `evaluatorOptimizer({...})` and a single `createProgressIO({...})` instance so all three roles share an artifact root.

```ts
import { createAgent, createProgressIO, evaluatorOptimizer } from '@graphorin/agent';

const planner = createAgent({
  name: 'planner',
  instructions:
    '[role:planner] You are the Planner agent. Expand the user request into a structured ' +
    'plan with phases, success criteria, and suggested tools.',
  provider,
});

const generator = createAgent({
  name: 'generator',
  instructions:
    '[role:generator] You are the Generator agent. Read the Planner artifact and implement ' +
    'the next unfinished phase incrementally.',
  provider,
});

const evaluator = createAgent({
  name: 'evaluator',
  instructions:
    '[role:evaluator] Score the candidate 0-10. Reply with `{ "score": number, "critique": ' +
    'string, "pass": boolean }`. `pass` is true when score >= 8.',
  provider,
});
```

The `[role:*]` markers in the system prompts let the deterministic stub provider classify which role is calling and emit a tuned reply per role. Real LLMs ignore the marker; it is purely a stub-routing aid.

The wiring snippet (matches `runHarness` in `src/main.ts`):

```ts
const progressIO = createProgressIO({ artifactRoot });
const runId = `harness_${Date.now().toString(36)}_${...}`;

const plan = await streamAgent(planner, request);
const plannerArtifact = await progressIO.write(runId, plan, { role: 'planner' });

const outcome = await evaluatorOptimizer<string>(request, {
  generator: async (input, priorCritique) => {
    const refs = await progressIO.read(runId, { role: 'planner' });
    const candidate = await streamAgent(generator, buildGeneratorInput(input, refs, priorCritique));
    await progressIO.write(runId, candidate, { role: 'generator' });
    return candidate;
  },
  evaluator: async (input, candidate) => parseEvaluatorOutcome(
    await streamAgent(evaluator, buildEvaluatorInput(input, candidate)),
  ),
  maxIterations: 3,
  rubric: { kind: 'zod', instructions: '...' },
  runId,
  sessionId,
  agentId: 'three-agent-harness',
});
```

### Why `evaluatorOptimizer({...})` and not a hand-rolled `for` loop?

`evaluatorOptimizer({...})` enforces three boundary contracts you would otherwise reinvent:

1. **Iteration boundary discipline**. Each iteration is a fresh `agent.run(...)`-equivalent boundary. The Generator's iteration-N input is the original user input + the Evaluator's iteration-(N-1) critique - *not* the Generator's iteration-(N-1) internal message history. RB-42 / DEC-158.
2. **`maxIterations >= 1` enforcement**. The helper throws `EvaluatorOptimizerConfigError` if you pass `0` or a non-finite number. No accidental infinite loops.
3. **Structured `EvaluatorOutcome`**. The `evaluator` callable must return `{ score: number, pass: boolean, critique: string }`. The harness's `parseEvaluatorOutcome(...)` extracts this from the agent's JSON reply with a sane fallback.

The returned `EvaluatorOptimizerOutcome` carries `terminationReason: 'pass' | 'maxIterations' | 'generator-exhausted' | 'cancelled'`, the per-iteration history, and the merged `output` (default `'last-iteration'`; opt into `'best-score'` via `mergeStrategy`).

---

## Structured-handoff artifacts

`createProgressIO({ artifactRoot })` persists UTF-8 text artifacts under:

```
<artifactRoot>/<runId>/progress/<role>.<seq>.txt
```

`<seq>` is a 3-digit zero-padded counter that auto-increments per `(runId, role)`. The Planner's first write becomes `planner.001.txt`; subsequent Generator writes are `generator.001.txt`, `generator.002.txt`, … The harness atomic-writes via `.tmp + rename` so a crashed write does not leave half-written artifacts.

`agent.progress.read({ role, runId? })` returns the same `ProgressArtifactRef[]` shape the writer emits. Cross-run reads require an explicit `runId` cursor (see `ProgressIO.read` in `@graphorin/agent`). This example surfaces that cursor as `runHarness({ priorRunId })` or **`GRAPHORIN_HARNESS_PRIOR_RUN_ID`** so a new Planner pass can load the prior session's planner artifacts from the same `artifactRoot`. Listing prior runs without a cursor remains out of scope for this example.

### Sandbox-tier-aware path mapping

graphorin's runtime maps `artifactRoot` according to the chosen sandbox tier:

| Tier        | `artifactRoot` resolution                        |
| ----------- | ------------------------------------------------ |
| `'project'` | `./.graphorin/progress` (per-project, gitignored)|
| `'user'`    | `~/.graphorin/progress` (per-user)               |
| `'system'`  | `os.tmpdir()/graphorin-progress` (default)       |

Library-mode callers can opt into any tier by passing the absolute path explicitly to `createProgressIO({ artifactRoot })`. The smoke test uses `os.tmpdir()` for hermeticity; the CLI defaults to `./.graphorin/three-agent-harness`.

### `.gitignore` guidance

If you persist artifacts under `./.graphorin/...` (the project tier default), add this line to your repo's `.gitignore`:

```
.graphorin/progress/
```

Generator artifacts in particular can include large code blobs and intermediate critiques - they are operator-facing forensic state, not version-controlled review material.

---

## Variant: research-and-decide

`runResearchAndDecideVariant({...})` swaps the Generator phase for a fan-out + judge-merge composition:

1. **Fan-out**. The Generator agent calls `generator.fanOut({...})` with `children: [webSearchAgent x 3]` under `maxConcurrentChildren: 4`. The harness ships a stubbed web-search sub-agent that emits a different one-line snippet per child index - three siblings in parallel, no shared state.
2. **`'judge-merge'`**. The merge strategy is a `comparisonJudge` agent that receives the per-child evidence snippets and emits a single decision paragraph. `Agent.fanOut({...})` enforces failed-child isolation - a child that throws produces a `ChildResult { status: 'failed' }` instead of aborting the merge.
3. **Citation post-processing**. A minimal `createCitationAgent({ sources, mode: 'inline' })` helper splits the judge's draft into claims and binds each to the supplied source list via lowercased substring overlap. Bound claims are rewritten with inline `[Source N]` markers; unbound claims pass through unchanged. The helper increments `agent.citation.bound.total` / `agent.citation.unbound.total` counters via the configured `Tracer` if one is wired (otherwise it counts in-memory and surfaces the totals on `CitationResult`).

```ts
const fanOutResult = await generator.fanOut<string>({
  children: webSearchAgents.map((agent, idx) => ({
    agentId: `web-search-${idx}`,
    invoke: () => streamAgent(agent, `${question} [child:${idx}]`),
  })),
  maxConcurrentChildren: 4,
  mergeStrategy: {
    kind: 'judge-merge',
    judge: async (children) => streamAgent(judge, summarizeForJudge(children)),
  },
});

const sources = defaultStubSources();
const citationAgent = createCitationAgent({ sources, mode: 'inline' });
const { text, boundCount, unboundCount } = citationAgent.bind(fanOutResult.output);
```

> **Note** - `createCitationAgent({...})` is shipped here as an example helper, ship in the framework later. The implementation in `src/citation-agent.ts` is intentionally small and isolated so reviewers can read the substring-overlap heuristic end-to-end inside one file. A future graphorin release will expose a richer version (embeddings + LLM judge + retrieval index).

---

## Optional stretch: workflow integration

The harness composes orthogonally with graphorin's workflow engine. The fan-out call lives at the **agent step level** (children share parent `RunContext` lineage; merged within one `agent.run(...)` call). The workflow engine's `Dispatch(...)` primitive lives at the **workflow step level** (children are checkpointed durable tasks).

The two patterns combine cleanly: an outer workflow can `Dispatch(...)` per Planner phase, and each phase can `Agent.fanOut(...)` internally. See [`examples/document-pipeline`](../document-pipeline/README.md) for the canonical `Dispatch(...)` outer pattern.

---

## Cost expectations

With hosted frontier models (fast tier for rubric scoring, capable tier for planning and code generation), a full LRU-cache harness run often lands roughly **USD $0.50-2.00** per end-to-end execution, depending on iteration count and provider list prices. The research-and-decide branch adds parallel lookup simulations plus a merge step - plan extra headroom accordingly.

These figures are indicative only. The default CI recipe uses the stub provider and incurs no usage charges.

---

## Recipe selector

The example exposes one configurable recipe through `GRAPHORIN_LLM_RECIPE`:

| Recipe   | Default? | Network? | What it does                                                                  |
| -------- | -------- | -------- | ----------------------------------------------------------------------------- |
| `stub`   | yes      | no       | Deterministic per-role replies. CI safe.                                      |
| `ollama` | no       | localhost only | Wraps `ollamaAdapter({ baseUrl, model })` - set `GRAPHORIN_OLLAMA_BASE_URL` and `GRAPHORIN_LLM_MODEL` to override defaults. |
| `GRAPHORIN_HARNESS_PRIOR_RUN_ID` | - | no | Optional. When set, the Planner prompt includes planner artifacts from that `runId` under the same `GRAPHORIN_ARTIFACT_ROOT` (continuation after restart). |

Use the broader recipe matrix from [`examples/personal-assistant-cli`](../personal-assistant-cli/README.md) (`llamacpp-server`, `llamacpp-node`) if you need other local-LLM stacks.

---

## Project layout

```
examples/three-agent-harness/
├── src/
│   ├── main.ts             # runHarness({...}), runResearchAndDecideVariant({...}), CLI entry
│   ├── citation-agent.ts   # Minimal createCitationAgent({...}) helper
│   ├── lru-fixture.ts      # Canonical LRUCache reference + source string
│   └── stub-provider.ts    # Deterministic per-role Provider (no network)
├── tests/
│   └── smoke.test.ts       # vitest coverage (stub provider + artifact paths + variant)
├── CHANGELOG.md
├── package.json
├── tsconfig.json
├── tsdown.config.ts
└── vitest.config.ts
```

## Troubleshooting

- **`Unknown GRAPHORIN_LLM_RECIPE='...'`** - pick one of `stub`, `ollama`.
- **`GRAPHORIN_HARNESS_PRIOR_RUN_ID` has no effect** - the id must match a `runId` directory that already exists under your `GRAPHORIN_ARTIFACT_ROOT` (default `./.graphorin/three-agent-harness`) and contain `progress/planner.*.txt`.
- **`'maxIterations' must be >= 1`** - `evaluatorOptimizer({...})` rejects `0` and non-finite numbers; pass a positive integer.
- **Generator output mismatch in the smoke test** - the stub emits `LRU_FIXTURE_SOURCE` byte-for-byte; if you tweak the fixture, update the test assertion.

---

## Observability

Set **`GRAPHORIN_TRACE=console`** for terminal span export via `@graphorin/example-trace-helper`. Persisted SQLite traces are surfaced by **`graphorin traces`** when using the standalone server. Full notes: [`TRACING.md`](../TRACING.md).

---

**Graphorin** · v0.13.13 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
