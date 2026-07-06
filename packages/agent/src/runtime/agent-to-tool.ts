/**
 * `agent.toTool()` - expose an agent as a callable sub-agent tool
 * (AG-17 / D2): least-authority seeding from the parent history, the
 * contextFold distillation of a completed child run, and the coarse
 * child-taint propagation that re-arms the parent's data-flow ledger.
 * Extracted verbatim from `factory.ts` (issue #23); the former factory
 * closures now hang off {@link createToTool}'s deps.
 *
 * @packageDocumentation
 */

import type {
  AgentEvent,
  AgentResult,
  Message,
  RunState,
  Tool,
  ToolExecutionContext,
  UsageAccumulator,
} from '@graphorin/core';
import { toolReturn } from '@graphorin/core';
import type { AgentCallOptions, AgentConfig, AgentInput, AgentToToolOptions } from '../types.js';
import { foldChildRunUsage } from './messages.js';

/**
 * W-033: fold the child's usage into the parent run through the tool
 * context. `RunContext.state` is typed as a readonly projection for
 * user tools (W-047); this runtime-internal seam is the sanctioned
 * mutation point - the runtime owns the state lifecycle.
 */
function foldIntoParent(
  ctx: ToolExecutionContext<unknown> | undefined,
  childState: RunState,
  childName: string,
): void {
  if (ctx === undefined) return;
  const parentState = ctx.runContext.state as unknown as RunState | undefined;
  const usageAcc = ctx.runContext.usage as UsageAccumulator | undefined;
  if (parentState !== undefined && typeof parentState.usage?.totalTokens === 'number') {
    foldChildRunUsage(parentState, usageAcc, childState, childName);
    return;
  }
  // A foreign harness mounting this tool outside the graphorin loop may
  // hand a structurally-minimal context - fold into the accumulator only.
  const byModel = childState.usageByModel;
  if (byModel !== undefined && Object.keys(byModel).length > 0) {
    for (const [modelId, usage] of Object.entries(byModel)) usageAcc?.add(modelId, usage);
    return;
  }
  const aggregate = childState.usage;
  if (aggregate.promptTokens > 0 || aggregate.completionTokens > 0 || aggregate.totalTokens > 0) {
    usageAcc?.add(`sub-agent:${childName}`, aggregate);
  }
}

/** What {@link createToTool} needs from the agent factory scope. */
export interface ToToolDeps<TDeps, TOutput> {
  readonly config: AgentConfig<TDeps, TOutput>;
  readonly run: (
    input: AgentInput | RunState,
    options?: AgentCallOptions<TDeps>,
  ) => Promise<AgentResult<TOutput>>;
  readonly stream: (
    input: AgentInput | RunState,
    options?: AgentCallOptions<TDeps>,
  ) => AsyncIterable<AgentEvent<TOutput>>;
}

/**
 * W-001: well-known marker on every `toTool()` tool object. The
 * graphorin tool-call walk detects it and executes the sub-agent
 * INLINE (through the same seam as a handoff) so a child suspending on
 * `awaiting_approval` parks on the parent instead of throwing from the
 * executor; the resume router resolves parked toTool sub-runs through
 * the same refs. `Symbol.for` so duplicate package copies agree.
 * Foreign harnesses mounting the tool outside the graphorin loop keep
 * the plain `execute()` behavior (a suspended child throws there).
 */
export const SUBAGENT_TOOL: unique symbol = Symbol.for('graphorin.SubAgentTool');

/** Child taint flags carried across the toTool fold (D2). */
export interface SubAgentFoldTaint {
  readonly untrusted?: boolean;
  readonly sensitive?: boolean;
  readonly sourceKind?: string;
}

/**
 * The live references {@link SUBAGENT_TOOL} carries (W-001). Typed
 * loosely on purpose: the walk is generic over foreign TDeps/TOutput
 * and only ever passes through values it received from the same
 * factory instance.
 */
export interface SubAgentToolRefs {
  readonly agentName: string;
  readonly run: (
    input: unknown,
    options?: Record<string, unknown>,
  ) => Promise<AgentResult<unknown>>;
  readonly stream: (
    input: unknown,
    options?: Record<string, unknown>,
  ) => AsyncIterable<AgentEvent<unknown>>;
  /** D2 capability restriction from `AgentToToolOptions.capability`. */
  readonly capability?: 'read-only';
  /** W-036: forwarding policy from `AgentToToolOptions.forwardEvents`. */
  readonly forwardEvents?: 'none' | 'lifecycle' | 'all';
  /** Reproduce `execute()`'s seed semantics (inputFilter + input string). */
  readonly buildSeed: (
    input: { readonly input: string },
    parentMessages: ReadonlyArray<Message>,
  ) => AgentInput;
  /** Reproduce `execute()`'s output shaping (exposeTurns/contextFold/taint). */
  readonly shapeCompleted: (
    result: AgentResult<unknown>,
    turns: ReadonlyArray<string>,
  ) => { readonly output: unknown; readonly taint?: SubAgentFoldTaint };
}

/** Read the {@link SUBAGENT_TOOL} refs off a (possibly wrapped) tool. */
export function getSubAgentToolRefs(tool: unknown): SubAgentToolRefs | undefined {
  if (typeof tool !== 'object' || tool === null) return undefined;
  const refs = (tool as Record<PropertyKey, unknown>)[SUBAGENT_TOOL];
  return refs === undefined ? undefined : (refs as SubAgentToolRefs);
}

/** Build the agent's `toTool` method over the factory's run surface. */
export function createToTool<TDeps, TOutput>(
  deps: ToToolDeps<TDeps, TOutput>,
): (options?: AgentToToolOptions) => Tool<{ readonly input: string }, TOutput, TDeps> {
  const { config, run, stream } = deps;

  // D2: distil a completed child run into a compact, bounded outcome the
  // parent folds into its context instead of the raw transcript/output.
  const foldRunOutcome = (result: AgentResult<TOutput>, maxChars: number): string => {
    const steps = result.state.steps;
    const toolNames = [
      ...new Set(steps.flatMap((step) => step.toolCalls.map((c) => c.call.toolName))),
    ];
    const header =
      `[sub-agent '${config.name}' outcome] status=${result.status}; ` +
      `steps=${steps.length}; toolCalls=${steps.reduce((n, st) => n + st.toolCalls.length, 0)}` +
      (toolNames.length > 0 ? `; tools=${toolNames.join(', ')}` : '');
    const text = typeof result.output === 'string' ? result.output : JSON.stringify(result.output);
    const body =
      text.length > maxChars
        ? `${text.slice(0, maxChars)}\n[... ${text.length - maxChars} chars truncated by contextFold]`
        : text;
    return `${header}\n${body}`;
  };

  // D2: carry the child's coarse taint flags across the fold so the
  // parent's data-flow ledger re-arms (widen-only; a no-op when the
  // parent has no dataFlowPolicy).
  const taintFromChildState = (
    state: RunState,
  ): { untrusted?: boolean; sensitive?: boolean; sourceKind?: string } | undefined => {
    const summary = state.taintSummary;
    if (summary === undefined || (!summary.untrustedSeen && !summary.sensitiveSeen)) {
      return undefined;
    }
    return {
      ...(summary.untrustedSeen ? { untrusted: true } : {}),
      ...(summary.sensitiveSeen ? { sensitive: true } : {}),
      sourceKind: 'sub-agent',
    };
  };

  const toTool = (
    options: AgentToToolOptions = {},
  ): Tool<{ readonly input: string }, TOutput, TDeps> => {
    const exposeTurns = options.exposeTurns ?? 'final';
    const foldMaxChars =
      options.contextFold === undefined || options.contextFold === false
        ? null
        : typeof options.contextFold === 'object'
          ? (options.contextFold.maxChars ?? 2000)
          : 2000;
    const propagateTaint = options.propagateTaint !== false;
    const toolName = options.name ?? `subagent_${config.name}`;
    const description = options.description ?? `Invoke sub-agent '${config.name}'.`;

    // Shared by `execute()` and the W-001 inline walk: seed semantics
    // (least authority - input string only unless an inputFilter opts
    // parent history in) and completed-result shaping.
    const buildSeed = (
      input: { readonly input: string },
      parentMessages: ReadonlyArray<Message> | undefined,
    ): AgentInput =>
      options.inputFilter !== undefined && parentMessages !== undefined
        ? ([
            ...options.inputFilter(parentMessages),
            { role: 'user' as const, content: input.input },
          ] as Message[])
        : input.input;
    const shapeCompleted = (
      result: AgentResult<TOutput>,
      turns: ReadonlyArray<string>,
    ): { readonly output: unknown; readonly taint?: SubAgentFoldTaint } => {
      const taint = propagateTaint ? taintFromChildState(result.state) : undefined;
      const output =
        exposeTurns === 'all'
          ? foldMaxChars !== null
            ? foldRunOutcome(result, foldMaxChars)
            : turns.join('\n\n')
          : exposeTurns === 'none'
            ? ''
            : foldMaxChars !== null
              ? foldRunOutcome(result, foldMaxChars)
              : result.output;
      return { output, ...(taint !== undefined ? { taint } : {}) };
    };

    const schema = {
      parse: (v: unknown): { readonly input: string } => v as { readonly input: string },
      safeParse: (v: unknown) => ({
        success: true as const,
        data: v as { readonly input: string },
      }),
      toJSON: (): Record<string, unknown> => ({
        type: 'object',
        properties: { input: { type: 'string' } },
        required: ['input'],
      }),
    };
    const tool: Tool<{ readonly input: string }, TOutput, TDeps> = {
      name: toolName,
      description,
      inputSchema: schema as unknown as Tool<
        { readonly input: string },
        TOutput,
        TDeps
      >['inputSchema'],
      sideEffectClass: 'side-effecting',
      async execute(input, ctx) {
        // AG-17: the parent ToolExecutionContext propagates - the
        // parent's abort stops the sub-agent, deps/sessionId flow
        // through, and the optional `inputFilter` shapes a seed from
        // the parent history. Least authority by default: without a
        // filter the sub-agent sees ONLY the input string, never the
        // parent conversation.
        const callOpts: AgentCallOptions<TDeps> = {
          ...(ctx?.signal !== undefined ? { signal: ctx.signal } : {}),
          ...(ctx?.runContext.deps !== undefined ? { deps: ctx.runContext.deps as TDeps } : {}),
          ...(ctx?.runContext.sessionId !== undefined
            ? { sessionId: ctx.runContext.sessionId }
            : {}),
          // D2: run the child under a restricted capability (read-only
          // workers in an orchestrator-worker fan-out).
          ...(options.capability !== undefined ? { capability: options.capability } : {}),
          // W-036: the child's run span parents under the calling tool's
          // span - one trace tree even through the executor path.
          ...(ctx?.runContext.span !== undefined ? { parentSpan: ctx.runContext.span } : {}),
        };
        const seed = buildSeed(input, ctx?.runContext.messages);
        if (exposeTurns === 'all') {
          // Replay the streamed text completions as the result so
          // the parent agent sees every turn the sub-agent
          // produced. `exposeTurns: 'final'` (default) and
          // `'none'` skip the per-turn assembly.
          const turns: string[] = [];
          let endResult: AgentResult<TOutput> | undefined;
          for await (const ev of stream(seed, callOpts)) {
            if (ev.type === 'text.complete') turns.push(ev.text);
            else if (ev.type === 'agent.end') endResult = ev.result;
          }
          // W-033: fold BEFORE the non-completed throw - tokens were
          // spent whether or not the child completed.
          if (endResult !== undefined) {
            foldIntoParent(
              ctx as ToolExecutionContext<unknown> | undefined,
              endResult.state,
              config.name,
            );
          }
          if (endResult !== undefined && endResult.status !== 'completed') {
            throw new Error(
              `sub-agent '${config.name}' ${endResult.status}${
                endResult.error !== undefined ? `: ${endResult.error.message}` : ''
              }`,
            );
          }
          if (endResult === undefined) return turns.join('\n\n') as unknown as TOutput;
          const shapedAll = shapeCompleted(endResult, turns);
          return (shapedAll.taint !== undefined
            ? toolReturn({ output: shapedAll.output, taint: shapedAll.taint })
            : shapedAll.output) as unknown as TOutput;
        }
        const result = await run(seed, callOpts);
        // W-033: fold BEFORE the non-completed throw (see 'all' branch).
        foldIntoParent(ctx as ToolExecutionContext<unknown> | undefined, result.state, config.name);
        // AG-17/AG-22 class: a non-completed sub-run is a TOOL ERROR,
        // never an empty-string success.
        if (result.status !== 'completed') {
          throw new Error(
            `sub-agent '${config.name}' ${result.status}${
              result.error !== undefined ? `: ${result.error.message}` : ''
            }`,
          );
        }
        const shaped = shapeCompleted(result, []);
        return (shaped.taint !== undefined
          ? toolReturn({ output: shaped.output, taint: shaped.taint })
          : shaped.output) as unknown as TOutput;
      },
    };
    // W-001: attach the inline-walk refs (see SUBAGENT_TOOL). Symbol
    // properties survive the registry's `{...tool}` normalization spread.
    const refs: SubAgentToolRefs = {
      agentName: config.name,
      run: run as unknown as SubAgentToolRefs['run'],
      stream: stream as unknown as SubAgentToolRefs['stream'],
      ...(options.capability !== undefined ? { capability: options.capability } : {}),
      ...(options.forwardEvents !== undefined ? { forwardEvents: options.forwardEvents } : {}),
      buildSeed,
      shapeCompleted: shapeCompleted as unknown as SubAgentToolRefs['shapeCompleted'],
    };
    (tool as unknown as Record<PropertyKey, unknown>)[SUBAGENT_TOOL] = refs;
    return tool;
  };

  return toTool;
}
