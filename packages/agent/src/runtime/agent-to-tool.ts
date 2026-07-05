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

import type { AgentEvent, AgentResult, Message, RunState, Tool } from '@graphorin/core';
import type { AgentCallOptions, AgentConfig, AgentInput, AgentToToolOptions } from '../types.js';

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
        };
        const seed: AgentInput =
          options.inputFilter !== undefined && ctx !== undefined
            ? ([
                ...options.inputFilter(ctx.runContext.messages),
                { role: 'user' as const, content: input.input },
              ] as Message[])
            : input.input;
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
          if (endResult !== undefined && endResult.status !== 'completed') {
            throw new Error(
              `sub-agent '${config.name}' ${endResult.status}${
                endResult.error !== undefined ? `: ${endResult.error.message}` : ''
              }`,
            );
          }
          const allOutput = (foldMaxChars !== null && endResult !== undefined
            ? foldRunOutcome(endResult, foldMaxChars)
            : turns.join('\n\n')) as unknown as TOutput;
          const allTaint =
            propagateTaint && endResult !== undefined
              ? taintFromChildState(endResult.state)
              : undefined;
          return (allTaint !== undefined
            ? { output: allOutput, taint: allTaint }
            : allOutput) as unknown as TOutput;
        }
        const result = await run(seed, callOpts);
        // AG-17/AG-22 class: a non-completed sub-run is a TOOL ERROR,
        // never an empty-string success.
        if (result.status !== 'completed') {
          throw new Error(
            `sub-agent '${config.name}' ${result.status}${
              result.error !== undefined ? `: ${result.error.message}` : ''
            }`,
          );
        }
        const taint = propagateTaint ? taintFromChildState(result.state) : undefined;
        const output = (exposeTurns === 'none'
          ? ''
          : foldMaxChars !== null
            ? foldRunOutcome(result, foldMaxChars)
            : result.output) as unknown as TOutput;
        return (taint !== undefined ? { output, taint } : output) as unknown as TOutput;
      },
    };
    return tool;
  };

  return toTool;
}
