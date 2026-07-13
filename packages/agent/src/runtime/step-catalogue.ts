/**
 * Per-step tool-catalogue support for the agent runtime: projection of
 * a tool's declared schemas onto the provider wire contract
 * (`ToolDefinition`), including worked examples, plus the per-step
 * registry / executor / catalogue / preferred-model resolution.
 * Extracted verbatim from `factory.ts` (issue #23).
 *
 * @packageDocumentation
 */

import type {
  AISpan,
  Message,
  Provider,
  ProviderRequest,
  ReasoningRetention,
  RunState,
  Tool,
  ToolChoice,
  ToolDefinition,
  ToolDefinitionExample,
} from '@graphorin/core';
import type { ToolArgumentPolicyGuard, ToolExecutor } from '@graphorin/tools/executor';
import type { ToolRegistry } from '@graphorin/tools/registry';
import type { ResultReader } from '@graphorin/tools/result';
import { projectSchemaToJsonSchema } from '@graphorin/tools/schema';
import { ToolNotFoundError } from '../errors/index.js';
import { type PreferredModelResolution, resolvePreferredModel } from '../preferred-model/index.js';
import { orderPromotedTools } from '../tooling/catalogue.js';
import { buildToolRegistry } from '../tooling/registry-build.js';
import type { AgentConfig, PrepareStepOverrides } from '../types.js';
import { buildHandoffTool, type HandoffEntry } from './handoff.js';
import { buildStepMessages } from './messages.js';
import { specToProvider } from './provider-events.js';
import type { MutableRunState } from './run-input.js';
import { registerReadResult, registerToolSearch } from './tool-wiring.js';

/** WARN-once keys for schemas the projection cannot read (per process). */
const unprojectableSchemaWarned = new Set<string>();

/**
 * Resolve a tool's declared schema - plain Zod (v3/v4), `toJSON()`-bearing,
 * or already-JSON-Schema data - to a JSON Schema record via the shared
 * projection (tools-01). Pre-fix this only honoured `toJSON()` and passed
 * everything else through verbatim, so every plain-Zod tool serialised as
 * `{"_def":...}` internals on OpenAI-shaped/Ollama/vercel wire bodies.
 * `undefined` when nothing usable can be projected (caller substitutes a
 * permissive `{}`), with a WARN so the degradation is never silent.
 */
function projectSchema(
  raw: unknown,
  toolName: string,
  slot: 'input' | 'output',
): Readonly<Record<string, unknown>> | undefined {
  return projectSchemaToJsonSchema(raw, {
    onUnsupported: (detail) => {
      const key = `${toolName}:${slot}:${detail}`;
      if (unprojectableSchemaWarned.has(key)) return;
      unprojectableSchemaWarned.add(key);
      console.warn(
        `[graphorin/agent] tool '${toolName}' ${slot} schema: '${detail}' cannot be projected ` +
          'to JSON Schema - that fragment degrades to a permissive {} on the provider wire body.',
      );
    },
  });
}

export function toolToDefinition(tool: Tool): ToolDefinition {
  const ts = tool as Tool & {
    readonly inputSchema?: unknown;
    readonly outputSchema?: unknown;
  };
  const inputSchema = projectSchema(ts.inputSchema, tool.name, 'input') ?? {};
  // A5: project the output schema so structured-output providers + typed
  // code-mode see the tool's result shape.
  const outputSchema = projectSchema(ts.outputSchema, tool.name, 'output');
  const examples = renderToolExamples(tool);
  return {
    name: tool.name,
    description: tool.description,
    inputSchema,
    ...(outputSchema !== undefined ? { outputSchema } : {}),
    ...(examples !== undefined ? { examples } : {}),
  };
}

/**
 * Project a tool's worked `examples` onto the provider wire contract
 * (WI-06 / P2-3). Examples are rendered only when the tool eagerly
 * renders them: the registry resolves the `defer_loading` auto-rule into
 * `examplesEagerlyRendered`, so a deferred tool resolves to `false` and is
 * skipped (its examples stay out of context even once `tool_search`
 * promotes it). `undefined` - the "runtime decides" case for a plain
 * eager tool - renders, since the tool is already advertised this step.
 *
 * Bounded to ≤5 to honour the `ToolExample` `[1,5]` contract even when a
 * tool slipped past the registry's overflow WARN (which does not truncate).
 */
function renderToolExamples(tool: Tool): ReadonlyArray<ToolDefinitionExample> | undefined {
  const examples = tool.examples;
  if (examples === undefined || examples.length === 0) return undefined;
  if (tool.examplesEagerlyRendered === false) return undefined;
  return examples.slice(0, 5).map((ex) => ({
    input: ex.input,
    output: ex.output,
    ...(ex.comment !== undefined ? { comment: ex.comment } : {}),
  }));
}

/**
 * The run-scoped inputs of the per-step catalogue resolution. Field
 * names mirror the run-loop locals the former inline block captured.
 */
export interface StepCatalogueEnv<TDeps, TOutput> {
  readonly config: AgentConfig<TDeps, TOutput>;
  readonly isCodeMode: boolean;
  readonly toolRegistry: ToolRegistry;
  readonly toolExecutor: ToolExecutor;
  readonly makeToolExecutor: (
    registry: ToolRegistry,
    opts?: { readonly quiet?: boolean },
  ) => ToolExecutor;
  readonly resultReader: ResultReader;
  readonly handoffMap: ReadonlyMap<string, HandoffEntry<TDeps>>;
  readonly handoffNames: ReadonlyArray<string>;
  readonly codeModeAdvertised: ReadonlyArray<Tool<unknown, unknown, TDeps>>;
  readonly activeRunCapability: 'read-only' | undefined;
  readonly promotedDeferred: Set<string>;
  readonly runStartPromotions: Set<string> | undefined;
  /**
   * E1: the compiled argument-policy guard. Its name-level deny filters
   * the advertised catalogue (eager + handoffs + promotions) so a
   * denied tool's name/schema never reach the model; the executor's
   * mirror blocks fabricated calls anyway.
   */
  readonly argumentPolicyGuard?: ToolArgumentPolicyGuard | undefined;
  /**
   * C1/C2: per-run pinned provider (`AgentCallOptions.pinnedProvider`).
   * When set, every step resolves to exactly this provider - it wins
   * over `prepareStep` overrides and the whole preference ladder, and
   * the fallback chain is never consulted (fail-closed model pinning
   * for proactive fires).
   */
  readonly pinnedProvider?: Provider;
}

/** What one step's catalogue resolution hands back to the run loop. */
export interface StepToolContext<TDeps> {
  readonly stepRegistry: ToolRegistry;
  readonly stepExecutor: ToolExecutor;
  readonly stepTools: ReadonlyArray<Tool<unknown, unknown, TDeps>>;
  readonly primary: PreferredModelResolution;
  readonly fallbackChain: Provider[];
}

/**
 * Resolve the registry + executor for this step. The warm-up
 * pair is bound to config.tools + skills; a `prepareStep` tool
 * override builds a step-scoped pair so the advertised catalogue
 * and the executor agree on the same tool set (incl. deferred
 * discovery for the overridden set). Code-mode does not honour a
 * per-step `tools` override (the meta-tools + bridge are bound to
 * the warm-up registry), so it always uses the warm-up pair.
 *
 * Also assembles the per-step tool catalogue (code-mode meta-tools or
 * eager + handoffs + promotions, read-only filtered under D2), resolves
 * the step's preferred model (AG-15: consulting only the tools the
 * model CALLED on the previous step), and derives the step's provider
 * fallback chain (RB-48: a `prepareStep` provider override suppresses
 * the chain).
 */
export function resolveStepToolContext<TDeps, TOutput>(
  env: StepCatalogueEnv<TDeps, TOutput>,
  overrides: PrepareStepOverrides<TDeps>,
  lastStepCalledToolNames: ReadonlyArray<string>,
): StepToolContext<TDeps> {
  const { config, isCodeMode, toolRegistry, toolExecutor, makeToolExecutor } = env;
  const { resultReader, handoffMap, handoffNames, codeModeAdvertised } = env;
  const { activeRunCapability, promotedDeferred, runStartPromotions } = env;

  const useOverrideRegistry = overrides.tools !== undefined && !isCodeMode;
  const stepRegistry: ToolRegistry = useOverrideRegistry
    ? buildToolRegistry({
        tools: overrides.tools as ReadonlyArray<Tool<unknown, unknown, unknown>>,
      }).registry
    : toolRegistry;
  if (useOverrideRegistry) {
    registerToolSearch(
      stepRegistry,
      config.toolPromotion === 'run-boundary' ? 'next-run' : 'next-step',
      env.argumentPolicyGuard?.deniesName !== undefined
        ? (toolName: string): boolean =>
            env.argumentPolicyGuard?.deniesName?.(toolName).denied === true
        : undefined,
    );
    registerReadResult(stepRegistry, resultReader);
  }
  const stepExecutor: ToolExecutor = useOverrideRegistry
    ? makeToolExecutor(stepRegistry)
    : toolExecutor;

  // Build the per-step tool catalogue. Handoff tools are synthetic
  // per-step entries and are always advertised.
  const handoffTools: Tool<unknown, unknown, TDeps>[] = handoffNames.map((n) => {
    const h = handoffMap.get(n);
    if (h === undefined) throw new ToolNotFoundError(n);
    return buildHandoffTool<TDeps>(h.agent);
  });
  // Code-mode (WI-11): advertise only the `code_search` /
  // `code_execute` (+ `read_result`) meta-tools - the model reaches
  // every real tool through `code_execute`, so the real tools stay
  // registered (executable via the in-script bridge) but out of the
  // model's catalogue. Otherwise (WI-05): advertise the eager tools
  // (`tool_search` is itself eager iff a deferred tool exists) plus
  // any deferred tools already promoted by a `tool_search` this run -
  // never the rest of the deferred pool.
  // D2 single-writer constraint: a read-only run never ADVERTISES
  // writer tools (side-effecting / external-stateful) nor handoffs
  // (a transfer hands the writer pen to another agent). The
  // executor-level capability gate backs this up for calls the
  // model fabricates anyway.
  const readOnlyRun = activeRunCapability === 'read-only';
  const keepReadOnly = (t: Tool<unknown, unknown, TDeps>): boolean => {
    const cls = (t as { __sideEffectClass?: string }).__sideEffectClass ?? t.sideEffectClass;
    return cls === 'pure' || cls === 'read-only';
  };
  let stepTools: ReadonlyArray<Tool<unknown, unknown, TDeps>>;
  if (isCodeMode) {
    stepTools = readOnlyRun
      ? [...codeModeAdvertised.filter(keepReadOnly)]
      : [...codeModeAdvertised, ...handoffTools];
  } else {
    const eagerTools = stepRegistry.listEager() as ReadonlyArray<Tool<unknown, unknown, TDeps>>;
    // A7: emit promoted deferred tools in PROMOTION order (append-only) so
    // a later promotion joins the END and the prompt-cache prefix stays
    // byte-stable across steps. C1 (agent-11): handoff tools serialize
    // BEFORE the growing promoted section - handoffs are fixed per run,
    // so the stable prefix is now eager + handoffs + earlier promotions
    // and a new promotion shifts nothing that came before it.
    // 'run-boundary' promotion advertises only the run-start snapshot.
    const advertisedPromotions = runStartPromotions ?? promotedDeferred;
    const promotedTools = (
      advertisedPromotions.size === 0
        ? []
        : orderPromotedTools(advertisedPromotions, stepRegistry.listDeferred())
    ) as ReadonlyArray<Tool<unknown, unknown, TDeps>>;
    stepTools = readOnlyRun
      ? [...eagerTools.filter(keepReadOnly), ...promotedTools.filter(keepReadOnly)]
      : [...eagerTools, ...handoffTools, ...promotedTools];
  }
  // E1 deny-by-name (advertise half): drop name-denied tools from the
  // FINAL catalogue - after promotions fold in, so a promotion
  // rehydrated from a pre-deny run state cannot resurface the name.
  const deniesName = env.argumentPolicyGuard?.deniesName;
  if (deniesName !== undefined) {
    stepTools = stepTools.filter((t) => deniesName(t.name).denied !== true);
  }

  // AG-15: consult the hints of the tools the model CALLED on the
  // previous step - a smart-hinted but never-called tool must not
  // pin the whole conversation to the top cost tier. Steps with no
  // prior calls fall through to the agent-preferred default.
  const calledLastStep = new Set(lastStepCalledToolNames);
  const toolPreferences = stepTools
    .filter((t) => calledLastStep.has(t.name))
    .map((t) => {
      const tt = t as Tool<unknown, unknown, TDeps> & { readonly preferredModel?: unknown };
      return tt.preferredModel as Parameters<
        typeof resolvePreferredModel
      >[0]['toolPreferredModels'][number];
    });

  // C1/C2: a per-run pinned provider is invocation-scoped intent - it
  // wins over `prepareStep` and the whole preference ladder (the fire
  // must not inherit anyone else's model decisions).
  const primary: PreferredModelResolution =
    env.pinnedProvider !== undefined
      ? {
          resolvedProvider: env.pinnedProvider,
          resolvedModelId: env.pinnedProvider.modelId,
          source: 'pinned',
        }
      : resolvePreferredModel({
          ...(overrides.provider !== undefined ? { prepareStepProvider: overrides.provider } : {}),
          toolPreferredModels: toolPreferences,
          ...(config.preferredModel !== undefined
            ? { agentPreferredModel: config.preferredModel }
            : {}),
          agentDefaultProvider: config.provider,
          ...(config.modelTierMap !== undefined ? { modelTierMap: config.modelTierMap } : {}),
        });

  // RB-48: when `prepareStep` returns an explicit provider
  // override, the fallback chain is NOT consulted for this
  // step (the operator's explicit choice supersedes the
  // implicit fallback chain). A pinned provider (C1/C2) suppresses
  // the chain the same way - fail-closed by construction.
  const fallbackChain: Provider[] =
    primary.source === 'pinned' || primary.source === 'prepare-step'
      ? [primary.resolvedProvider]
      : [primary.resolvedProvider, ...(config.fallbackModels ?? []).map(specToProvider)];

  return { stepRegistry, stepExecutor, stepTools, primary, fallbackChain };
}

/** What the per-step request assembly needs from the run loop's scope. */
export interface StepRequestEnv<TDeps, TOutput> {
  readonly config: AgentConfig<TDeps, TOutput>;
  readonly state: MutableRunState & RunState;
  readonly messages: Message[];
  readonly sessionId: string;
  readonly agentId: string;
  readonly userId: string | undefined;
  readonly signal: AbortSignal;
  readonly structuredInstruction: string | undefined;
  readonly getActiveTodos: () => ReadonlyArray<import('@graphorin/core').TodoItem> | undefined;
}

/**
 * Assemble the step's base {@link ProviderRequest} over the shared
 * message buffer: the D6 request-only trailing additions (structured
 * instruction + plan recitation) ride `buildStepMessages`, the
 * `prepareStep` overrides / config knobs spread in exactly as the
 * inline literal did, and the effective reasoning-retention policy
 * rides the request (RB-42).
 */
export function buildBaseRequest<TDeps, TOutput>(
  env: StepRequestEnv<TDeps, TOutput>,
  overrides: PrepareStepOverrides<TDeps>,
  toolDefs: ReadonlyArray<ToolDefinition>,
  reasoningPolicy: ReasoningRetention,
  stepNumber: number,
  currentStepSpan: AISpan<'agent.step'> | undefined,
): ProviderRequest {
  const { config, state, messages, sessionId, agentId, userId, signal } = env;
  const { structuredInstruction, getActiveTodos } = env;
  return {
    // AG-3 fallback contract: for structured output the request
    // carries ONE trailing system instruction (JSON-only + schema)
    // in the request copy - never in the shared buffer or the
    // persisted RunState. Adapters with native structured output
    // additionally receive `outputType` below (PS-24 consumes it).
    messages: buildStepMessages(messages, structuredInstruction, getActiveTodos()),
    ...(config.outputType !== undefined
      ? {
          outputType: {
            kind: config.outputType.kind,
            ...(config.outputType.description !== undefined
              ? { description: config.outputType.description }
              : {}),
            ...(config.outputType.jsonSchema !== undefined
              ? { jsonSchema: config.outputType.jsonSchema }
              : {}),
          },
        }
      : {}),
    tools: toolDefs,
    ...(overrides.toolChoice !== undefined
      ? { toolChoice: overrides.toolChoice }
      : config.toolChoice !== undefined
        ? { toolChoice: config.toolChoice as ToolChoice }
        : {}),
    metadata: {
      sessionId,
      agentId,
      ...(userId !== undefined ? { userId } : {}),
      runId: state.id,
      stepNumber,
    },
    signal,
    ...(overrides.temperature !== undefined ? { temperature: overrides.temperature } : {}),
    ...(overrides.maxTokens !== undefined ? { maxTokens: overrides.maxTokens } : {}),
    ...(config.cachePolicy !== undefined ? { cachePolicy: config.cachePolicy } : {}),
    ...(currentStepSpan !== undefined ? { parentSpan: currentStepSpan } : {}),
    reasoningRetention: reasoningPolicy,
  };
}
