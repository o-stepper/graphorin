/**
 * Warm-up wiring of the agent's tool-execution stack: the spill
 * writer / result-reader pair, the memory guard,
 * data-flow guard and Progent argument-policy hooks, the shared
 * `ToolExecutor` factory, and the opt-in code-mode meta-tool
 * surface. Extracted verbatim from `factory.ts` (issue #23).
 *
 * @packageDocumentation
 */

import type { RunState, Tool } from '@graphorin/core';
import type { Memory } from '@graphorin/memory';
import {
  createToolExecutor,
  type ExecutorOptions,
  type ToolExecutor,
} from '@graphorin/tools/executor';
import type { ToolRegistry } from '@graphorin/tools/registry';
import {
  createDefaultSpillWriter,
  createFileResultReader,
  type ResultReader,
} from '@graphorin/tools/result';
import {
  buildMemoryGuard,
  buildSecretResolver,
  buildToolTokenCounter,
  createMemoryRegionReader,
  type ExecutorEventBridge,
} from '../tooling/adapters.js';
import { buildDataFlowGuard } from '../tooling/dataflow.js';
import { createPlanTool, PLAN_TOOL_NAME } from '../tooling/plan.js';
import { buildToolArgumentPolicy } from '../tooling/policy.js';
import { buildToolRegistry } from '../tooling/registry-build.js';
import type { AgentConfig } from '../types.js';
import {
  CODE_EXECUTE_NAME,
  CODE_SEARCH_NAME,
  composeResultReaders,
  READ_RESULT_NAME,
  registerCodeMode,
  registerReadResult,
  registerToolSearch,
  TOOL_SEARCH_NAME,
} from './tool-wiring.js';

/** What {@link wireToolExecution} needs from the agent factory scope. */
export interface ExecutorWiringDeps<TDeps, TOutput> {
  readonly config: AgentConfig<TDeps, TOutput>;
  readonly memory: Memory | undefined;
  readonly agentId: string;
  /** The synthetic handoff tool names (reserved from the code API). */
  readonly handoffToolNames: Iterable<string>;
  /** Lazy view of the in-flight run (read mid-run by the memory guard). */
  readonly getActiveRunState: () => RunState | undefined;
  /** Lazy view of the active run's capability (read by the code bridge). */
  readonly getActiveRunCapability: () => 'read-only' | undefined;
  /** Shared cell the streaming sink reads while a batch is in flight. */
  readonly executorBridgeSlot: { current: ExecutorEventBridge | undefined };
}

/** The executor stack {@link wireToolExecution} hands back to the factory. */
export interface ExecutorWiring<TDeps> {
  readonly toolRegistry: ToolRegistry;
  readonly spillWriter: ReturnType<typeof createDefaultSpillWriter>;
  readonly resultReader: ResultReader;
  readonly makeToolExecutor: (
    registry: ToolRegistry,
    opts?: { readonly quiet?: boolean },
  ) => ToolExecutor;
  readonly toolExecutor: ToolExecutor;
  readonly toolDataFlowGuard: ReturnType<typeof buildDataFlowGuard> | undefined;
  /**
   * The compiled argument-policy guard, shared with the run loop -
   * the walk's permission pre-screen (four-value `decide`) and the
   * deny-by-name surfaces (catalogue filter, `tool_search` exclusion,
   * inline handoff/sub-agent check) all consult the same object the
   * executor enforces with.
   */
  readonly toolArgumentPolicyGuard: ReturnType<typeof buildToolArgumentPolicy>['guard'];
  readonly ruleOfTwoCapabilityFloor: 'read-only' | undefined;
  readonly isCodeMode: boolean;
  readonly codeModeAdvertised: ReadonlyArray<Tool<unknown, unknown, TDeps>>;
}

/**
 * Construct the unified ToolExecutor once at warm-up,
 * bound to the registry above. Routing tool execution through the
 * executor activates the documented tool fields the inline loop
 * bypassed: per-tool `secretsAllowed` ACL, result truncation
 * (`maxResultTokens` / `truncationStrategy`), inbound sanitization,
 * memory-guard, idempotency keys and single-round repair.
 *
 * Durable HITL stays in the agent: approval is pre-screened below and
 * suspends the run, so the executor's `ApprovalGate` only ever sees
 * no-approval / pre-approved calls - it auto-grants and never blocks
 * the generator (Adapter G).
 *
 * Sandbox note: `config.tools` are inline `tool({...})` closures that
 * cannot be serialised to an out-of-process sandbox, and
 * `resolveSandbox` defaults user-defined tools to `worker-threads`.
 * Wiring a resolver that returned a real sandbox for that kind would
 * break every inline tool, so `sandboxResolver` is intentionally left
 * unset (the executor then runs inline - its documented fallback).
 * The resolved policy is still surfaced on the tool-execute span /
 * audit; real isolation applies to module-loadable (skill / MCP)
 * tools and is wired when those land.
 */
export function wireToolExecution<TDeps, TOutput>(
  deps: ExecutorWiringDeps<TDeps, TOutput>,
): ExecutorWiring<TDeps> {
  const { config, memory, agentId, executorBridgeSlot } = deps;
  const { getActiveRunState, getActiveRunCapability, handoffToolNames } = deps;

  // Assemble the unified tool registry at warm-up (Principle #12): one
  // registry across first-party + skill sources, with deterministic
  // cross-source collision resolution. Exposed read-only as
  // `agent.registry`; the run loop and `tool_search` consume it. The
  // registry is the tool-validation authority, so a malformed tool
  // fails fast here at construction.
  const toolRegistry = buildToolRegistry({
    ...(config.tools !== undefined
      ? { tools: config.tools as ReadonlyArray<Tool<unknown, unknown, unknown>> }
      : {}),
    ...(config.skills !== undefined ? { skills: config.skills } : {}),
    // C6: the minimal scaffold defers every tool that does not declare
    // `defer_loading` itself, so the per-step catalogue starts at
    // `tool_search` alone and tools surface through promotion.
    ...(config.scaffold === 'minimal' ? { deferLoadingByDefault: true } : {}),
  }).registry;

  // D4 Progent tool-argument policy + Rule-of-Two floor. `ruleOfTwo`
  // compiles to a policy (+ a read-only capability floor when it denies
  // external side effects); an explicit `toolPolicy` composes on top
  // (its rules are appended, so an explicit deny still wins). Built
  // once, shared by every executor AND by the run loop's permission
  // pre-screen / deny-by-name surfaces (E1). Compiled before
  // `registerToolSearch` so name-denied deferred tools are excluded
  // from discovery.
  const { guard: toolArgumentPolicyGuard, capabilityFloor: ruleOfTwoCapabilityFloor } =
    buildToolArgumentPolicy(config.toolPolicy, config.ruleOfTwo);
  const excludeDeniedName =
    toolArgumentPolicyGuard?.deniesName !== undefined
      ? (toolName: string): boolean =>
          toolArgumentPolicyGuard.deniesName?.(toolName).denied === true
      : undefined;

  // WI-05 (deferred loading + tool_search / P0-3): if any registered
  // tool sets `defer_loading: true`, register the built-in `tool_search`
  // so the model can discover those tools on demand. Tools that defer are
  // withheld from the per-step catalogue (see the loop below) until a
  // `tool_search` match promotes them, keeping large tool sets out of the
  // context window. When nothing defers this is a no-op.
  registerToolSearch(
    toolRegistry,
    config.toolPromotion === 'run-boundary' ? 'next-run' : 'next-step',
    excludeDeniedName,
  );

  // D6: opt-in structured plan tool (TodoWrite-style, journaled). It
  // mutates the ACTIVE run's todos through a closure; attention
  // recitation renders them back into each step's request copy.
  if (config.plan === true && toolRegistry.get(PLAN_TOOL_NAME) === undefined) {
    toolRegistry.register(
      createPlanTool((todos) => {
        const activeRunState = getActiveRunState();
        if (activeRunState !== undefined) {
          (activeRunState as { todos?: ReadonlyArray<import('@graphorin/core').TodoItem> }).todos =
            todos;
        }
      }) as unknown as Parameters<typeof toolRegistry.register>[0],
      { kind: 'built-in', subsystem: 'planning' },
    );
  }

  // WI-10 (result references / handles / P1-4): construct one spill
  // writer + reader pair at warm-up. The writer is handed to the executor
  // so a tool's `'spill-to-file'` truncation strategy externalises large
  // bodies to disk (0600, run-scoped); the reader - over the *same*
  // artifact root - backs the built-in `read_result` tool so the model can
  // page through a spilled artifact on demand instead of inlining the
  // whole blob. `read_result` is registered only when some tool spills.
  const spillWriter = createDefaultSpillWriter();
  const fileResultReader = createFileResultReader({ artifactRoot: spillWriter.artifactRoot });
  // WI-13 (P2-2): compose any operator-supplied result readers (e.g. an
  // MCP resource reader from `createMcpResourceReader`, for resolving
  // `resource_link` handles) after the spill-file reader. `read_result`
  // then pages both `graphorin-spill:` artifacts and external handles,
  // and is force-registered when external readers exist (even if no tool
  // spills) so those handles are resolvable.
  const externalResultReaders = config.resultReaders ?? [];
  const resultReader: ResultReader =
    externalResultReaders.length === 0
      ? fileResultReader
      : composeResultReaders([fileResultReader, ...externalResultReaders]);
  registerReadResult(toolRegistry, resultReader, { force: externalResultReaders.length > 0 });

  const toolApprovalGate: NonNullable<ExecutorOptions['approvalGate']> = {
    request: async () => ({ granted: true }),
  };
  const toolSecretResolver = buildSecretResolver();
  const toolTokenCounter = buildToolTokenCounter();
  // SDF-1: when memory is wired, bind a scope-aware region reader so the
  // executor's DEC-153 snapshot/verify cycle actually runs (the scope
  // resolves lazily from the in-flight run - the executor only invokes
  // the reader mid-run). Without memory the guard tiers stay skipped,
  // and a one-time WARN below makes that silent no-op visible.
  const memoryGuardWiring = buildMemoryGuard(
    memory,
    memory === undefined
      ? {}
      : {
          regionReader: createMemoryRegionReader(['working'], async (region) => {
            if (region !== 'working') return '';
            const activeRunState = getActiveRunState();
            const scope = {
              userId: activeRunState?.userId ?? agentId,
              ...(activeRunState?.sessionId !== undefined
                ? { sessionId: activeRunState.sessionId }
                : {}),
              agentId,
            };
            // W-054: call the statically-typed `Memory.working.compile`
            // directly - a signature change must break THIS build, not
            // silently turn the DEC-153 guard into a no-op through an
            // unchecked double cast returning ''.
            try {
              return await memory.working.compile(scope, agentId);
            } catch {
              // The reader is best-effort: a failed region read must not
              // turn the guard step into a run failure.
              return '';
            }
          }),
        },
  );
  const toolMemoryGuardFactory = memoryGuardWiring.memoryGuardFactory;
  if (memory === undefined) {
    const guarded = (config.tools ?? []).filter((t) => t.memoryGuardTier !== undefined);
    if (guarded.length > 0) {
      console.warn(
        `[graphorin/agent] ${guarded.length} tool(s) declare memoryGuardTier but no memory is wired - ` +
          'the DEC-153 snapshot/verify guard is skipped (SDF-1). Wire `memory` to activate it.',
      );
    }
  }
  // Provenance / data-flow guard (WI-12 / P1-3, opt-in). Built once and
  // shared by every executor (direct + code-mode quiet), so the sink gate
  // and taint recording apply uniformly. Off unless configured with a
  // non-`'off'` mode - zero overhead on the default path.
  const toolDataFlowGuard =
    config.dataFlowPolicy !== undefined && config.dataFlowPolicy.mode !== 'off'
      ? buildDataFlowGuard(config.dataFlowPolicy)
      : undefined;
  // W-103: the lethal-trifecta leg arms only when some tool can classify
  // as `sensitive` - by default that means `sensitivity: 'secret'`, and
  // no built-in tool ships with that tag. An operator who enables the
  // policy without tagging private-data tools silently gets only the
  // best-effort verbatim probe. One deterministic warn at construction
  // (mirrors the memoryGuardTier warn above); tools registered later are
  // not scanned - this is a wiring aid, not a gate.
  if (
    toolDataFlowGuard !== undefined &&
    (config.dataFlowPolicy?.guardTrifecta ?? true) &&
    config.dataFlowPolicy?.treatPiiAsSensitive !== true
  ) {
    const effectiveTiers = config.dataFlowPolicy?.sensitiveTiers ?? (['secret'] as const);
    const anySensitiveTool = (config.tools ?? []).some(
      (t) => t.sensitivity !== undefined && effectiveTiers.includes(t.sensitivity),
    );
    if (!anySensitiveTool) {
      console.warn(
        '[graphorin/agent] dataFlowPolicy is enabled but no registered tool declares a ' +
          "sensitivity within sensitiveTiers (default ['secret']) and treatPiiAsSensitive is " +
          'off - the lethal-trifecta leg cannot arm; only the best-effort verbatim ' +
          "untrusted-to-sink probe is active. Tag private-data tools (sensitivity: 'secret') " +
          'or widen sensitiveTiers / treatPiiAsSensitive.',
      );
    }
  }
  const toolStreamingSink: NonNullable<ExecutorOptions['streamingSink']> = (event) =>
    executorBridgeSlot.current?.sink(event);
  // `quiet` builds an executor without the streaming sink - used for
  // code-mode's in-script tool calls (WI-11), whose `tool.execute.*`
  // events must not interleave into the outer agent stream.
  const makeToolExecutor = (
    registry: ToolRegistry,
    opts?: { readonly quiet?: boolean },
  ): ToolExecutor =>
    createToolExecutor({
      registry,
      approvalGate: toolApprovalGate,
      secretResolver: toolSecretResolver,
      tokenCounter: toolTokenCounter,
      memoryGuardFactory: toolMemoryGuardFactory,
      ...(memoryGuardWiring.memoryRegionReader !== undefined
        ? { memoryRegionReader: memoryGuardWiring.memoryRegionReader }
        : {}),
      spill: spillWriter,
      ...(toolDataFlowGuard !== undefined ? { dataFlowGuard: toolDataFlowGuard } : {}),
      ...(toolArgumentPolicyGuard !== undefined ? { argumentPolicy: toolArgumentPolicyGuard } : {}),
      // E1: the permission hook rides every executor (direct + quiet
      // code-mode), so in-script tool calls face the same decision point.
      ...(config.permissionHook !== undefined ? { permissionHook: config.permissionHook } : {}),
      ...(opts?.quiet === true ? {} : { streamingSink: toolStreamingSink }),
      ...(config.maxParallelTools !== undefined
        ? { maxParallelTools: config.maxParallelTools }
        : {}),
      ...(config.toolRetry !== undefined ? { retry: config.toolRetry } : {}),
    });
  const toolExecutor = makeToolExecutor(toolRegistry);

  // Code-mode (WI-11 / P1-2, opt-in): advertise only the `code_search` /
  // `code_execute` meta-tools and let the model orchestrate tools inside a
  // sandbox, so intermediate results stay out of context. A quiet executor
  // backs the in-script tool bridge (same per-tool governance as direct
  // mode). `read_result` is registered after the meta-tools because
  // `code_execute` opts into `'spill-to-file'`, so a large final result can
  // be fetched back on demand. Default `'direct'` mode leaves all of this
  // untouched - `codeModeAdvertised` stays empty and the loop is unchanged.
  const isCodeMode = config.toolInvocation === 'code-mode';
  let codeModeAdvertised: ReadonlyArray<Tool<unknown, unknown, TDeps>> = [];
  if (isCodeMode) {
    const reserved = new Set<string>([
      CODE_EXECUTE_NAME,
      CODE_SEARCH_NAME,
      TOOL_SEARCH_NAME,
      READ_RESULT_NAME,
      ...handoffToolNames,
    ]);
    const metas = registerCodeMode(
      toolRegistry,
      makeToolExecutor(toolRegistry, { quiet: true }),
      reserved,
      getActiveRunCapability,
      // E3: the caller-chosen code-mode runtime + limits.
      config.codeMode,
    );
    registerReadResult(toolRegistry, resultReader);
    const readResult = toolRegistry.get(READ_RESULT_NAME);
    codeModeAdvertised = [
      ...metas,
      ...(readResult !== undefined ? [readResult] : []),
    ] as ReadonlyArray<Tool<unknown, unknown, TDeps>>;
  }

  return {
    toolRegistry,
    spillWriter,
    resultReader,
    makeToolExecutor,
    toolExecutor,
    toolDataFlowGuard,
    toolArgumentPolicyGuard,
    ruleOfTwoCapabilityFloor,
    isCodeMode,
    codeModeAdvertised,
  };
}
