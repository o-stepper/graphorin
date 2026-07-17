import pkg from '../package.json' with { type: 'json' };
/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * The framework-floor conformance registry (audit item 10): a set of
 * NAMED behavioral invariants the framework promises, each expressed
 * as a small deterministic, offline check against the REAL public API
 * (stub providers, `:memory:` SQLite with `skipSqliteVec`, no
 * network, no timers left running). A check throws with a clear
 * message on violation; the runner turns the registry into the
 * versioned conformance report stamped on every `benchmark:ci` run.
 */

import { inspect } from 'node:util';
import { AgentBudgetExceededError, createAgent } from '@graphorin/agent';
import type {
  AgentEvent,
  Checkpoint,
  CheckpointMetadata,
  Message,
  Provider,
  ProviderEvent,
  ProviderRequest,
  SessionScope,
  Tool,
  Usage,
} from '@graphorin/core';
import { CheckpointConflictError } from '@graphorin/core';
import { createMemory } from '@graphorin/memory';
import { lookupPrice } from '@graphorin/pricing';
import type { AuditDb, StoredAuditEntry } from '@graphorin/security';
import { appendAudit, SecretValue, verifyAuditChain } from '@graphorin/security';
import type { RunDescriptor } from '@graphorin/server';
import { RunStateTracker } from '@graphorin/server';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';

export const VERSION: string = pkg.version;

/**
 * One named framework-floor invariant. `run` resolves when the
 * behavior holds and throws with a violation message when it does not.
 */
export interface ConformanceCheck {
  readonly id: string;
  readonly area: string;
  readonly statement: string;
  run(): Promise<void>;
}

/** Throw with a clear violation message unless `condition` holds. */
function ensure(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/**
 * Mutation-safe execution counter. Checks read it through `value()` so
 * TypeScript's control-flow narrowing never pins a closure-mutated
 * `let` to a stale literal across `await` boundaries.
 */
function makeCounter(): { readonly bump: () => void; readonly value: () => number } {
  let n = 0;
  return {
    bump: () => {
      n += 1;
    },
    value: () => n,
  };
}

// ---------------------------------------------------------------------------
// Offline fixtures: scripted stub provider + schema-shim tools.
// ---------------------------------------------------------------------------

interface ProviderScript {
  readonly events: ReadonlyArray<ProviderEvent>;
}

/**
 * Script-driven offline Provider: each `stream(...)` call pops the next
 * script and replays its events (the proven mock-harness pattern).
 */
function scriptedProvider(scripts: ReadonlyArray<ProviderScript>): Provider & { calls(): number } {
  let cursor = 0;
  const provider: Provider = {
    name: 'conformance-stub',
    modelId: 'stub-model',
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: true,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 200_000,
      maxOutput: 8192,
    },
    async *stream(_req: ProviderRequest): AsyncIterable<ProviderEvent> {
      const script = scripts[cursor++];
      if (script === undefined) {
        throw new Error(`conformance stub provider: no script for call #${cursor - 1}`);
      }
      for (const ev of script.events) yield ev;
    },
    async generate(): Promise<never> {
      throw new Error('conformance stub provider: use stream(...)');
    },
  };
  return Object.assign(provider, { calls: () => cursor });
}

function usageOf(totalTokens: number, cost?: Usage['cost']): Usage {
  const half = Math.max(1, Math.floor(totalTokens / 2));
  return {
    promptTokens: half,
    completionTokens: half,
    totalTokens,
    ...(cost !== undefined ? { cost } : {}),
  };
}

function textScript(text: string, usage: Usage = usageOf(10)): ProviderScript {
  return {
    events: [
      {
        type: 'stream-start',
        metadata: { providerName: 'conformance-stub', modelId: 'stub-model' },
      },
      { type: 'text-delta', delta: text },
      { type: 'finish', finishReason: 'stop', usage },
    ],
  };
}

function toolCallScript(args: {
  readonly toolCallId: string;
  readonly toolName: string;
  readonly args: unknown;
  readonly usage?: Usage;
}): ProviderScript {
  return {
    events: [
      {
        type: 'stream-start',
        metadata: { providerName: 'conformance-stub', modelId: 'stub-model' },
      },
      { type: 'tool-call-start', toolCallId: args.toolCallId, toolName: args.toolName },
      {
        type: 'tool-call-input-delta',
        toolCallId: args.toolCallId,
        argsDelta: JSON.stringify(args.args),
      },
      { type: 'tool-call-end', toolCallId: args.toolCallId, finalArgs: args.args },
      { type: 'finish', finishReason: 'tool-calls', usage: args.usage ?? usageOf(10) },
    ],
  };
}

/** A permissive schema shim with a real JSON-Schema `toJSON` projection. */
function passthroughSchema(jsonSchema: Record<string, unknown>): Tool['inputSchema'] {
  return {
    parse: (v: unknown) => v,
    safeParse: (v: unknown) => ({ success: true as const, data: v }),
    toJSON: () => jsonSchema,
  } as Tool['inputSchema'];
}

function makeTool(args: {
  readonly name: string;
  readonly needsApproval?: boolean;
  readonly sideEffectClass?: Tool['sideEffectClass'];
  readonly onExecute?: () => void;
}): Tool {
  return {
    name: args.name,
    description: `Offline conformance fixture tool '${args.name}'.`,
    inputSchema: passthroughSchema({
      type: 'object',
      properties: { q: { type: 'string' } },
      additionalProperties: true,
    }),
    sideEffectClass: args.sideEffectClass ?? 'read-only',
    ...(args.needsApproval === true ? { needsApproval: true } : {}),
    async execute(input: unknown) {
      args.onExecute?.();
      return { ok: true, echoed: input };
    },
  };
}

async function withStore<T>(fn: (store: GraphorinSqliteStore) => Promise<T>): Promise<T> {
  const store = await createSqliteStore({
    path: ':memory:',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
  await store.init();
  try {
    return await fn(store);
  } finally {
    await store.close();
  }
}

const SCOPE = {
  userId: 'conformance-user',
  sessionId: 'conformance-session',
  agentId: 'conformance-agent',
} as const satisfies SessionScope;

// ---------------------------------------------------------------------------
// The checks.
// ---------------------------------------------------------------------------

const streamEventGrammar: ConformanceCheck = {
  id: 'agent.stream-event-grammar',
  area: 'agent',
  statement:
    'agent.stream emits a well-formed event grammar: one agent.start first, balanced ' +
    'step.start/step.end pairs, ordered tool lifecycle, text deltas that concatenate ' +
    'into text.complete, and exactly one terminal agent.end.',
  async run() {
    const provider = scriptedProvider([
      toolCallScript({ toolCallId: 'tc-1', toolName: 'lookup', args: { q: 'x' } }),
      textScript('all good'),
    ]);
    const agent = createAgent({
      name: 'grammar',
      instructions: 'Answer using the lookup tool when needed.',
      provider,
      tools: [makeTool({ name: 'lookup' })],
    });
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('check the grammar')) events.push(ev);

    const types = events.map((e) => e.type);
    ensure(types[0] === 'agent.start', `first event must be agent.start, got '${types[0]}'`);
    ensure(
      types.filter((t) => t === 'agent.start').length === 1,
      'agent.start must be emitted exactly once',
    );
    const endCount = types.filter((t) => t === 'agent.end').length;
    ensure(endCount === 1, `agent.end must be emitted exactly once, got ${endCount}`);
    ensure(
      types[types.length - 1] === 'agent.end',
      `last event must be agent.end, got '${types[types.length - 1]}'`,
    );
    ensure(!types.includes('agent.error'), 'a clean two-step run must emit no agent.error');
    const stepStarts = types.filter((t) => t === 'step.start').length;
    const stepEnds = types.filter((t) => t === 'step.end').length;
    ensure(
      stepStarts === 2 && stepEnds === 2,
      `step.start/step.end must balance at 2/2, got ${stepStarts}/${stepEnds}`,
    );
    const idx = (predicate: (e: AgentEvent) => boolean): number => events.findIndex(predicate);
    const callEnd = idx((e) => e.type === 'tool.call.end' && e.toolCallId === 'tc-1');
    const execStart = idx((e) => e.type === 'tool.execute.start' && e.toolCallId === 'tc-1');
    const execEnd = idx((e) => e.type === 'tool.execute.end' && e.toolCallId === 'tc-1');
    ensure(
      callEnd !== -1 && execStart !== -1 && execEnd !== -1,
      'tool lifecycle events (call.end / execute.start / execute.end) must all be present',
    );
    ensure(
      callEnd < execStart && execStart < execEnd,
      `tool lifecycle must be ordered call.end < execute.start < execute.end, got ${callEnd}/${execStart}/${execEnd}`,
    );
    const deltas = events
      .filter((e): e is Extract<AgentEvent, { type: 'text.delta' }> => e.type === 'text.delta')
      .map((e) => e.delta)
      .join('');
    const completes = events.filter(
      (e): e is Extract<AgentEvent, { type: 'text.complete' }> => e.type === 'text.complete',
    );
    ensure(completes.length === 1, `expected exactly one text.complete, got ${completes.length}`);
    ensure(
      completes[0]?.text === 'all good' && deltas === 'all good',
      `text deltas must concatenate into text.complete ('${deltas}' vs '${completes[0]?.text}')`,
    );
    const end = events[events.length - 1];
    ensure(
      end?.type === 'agent.end' && end.result.status === 'completed',
      'the terminal agent.end must carry a completed result',
    );
  },
};

const budgetPrecheck: ConformanceCheck = {
  id: 'agent.budget-precheck',
  area: 'agent',
  statement:
    'RunBudget.maxCostUsd is enforced BETWEEN steps: the crossing step completes (its ' +
    "tool ran), and with onExceed 'throw' the run rejects with AgentBudgetExceededError.",
  async run() {
    const toolRuns = makeCounter();
    const provider = scriptedProvider([
      toolCallScript({
        toolCallId: 'tc-cost',
        toolName: 'lookup',
        args: { q: 'pricey' },
        usage: usageOf(10, { amount: 0.05, currency: 'USD' }),
      }),
      textScript('never reached'),
    ]);
    const agent = createAgent({
      name: 'budgeted',
      instructions: 'Use the lookup tool.',
      provider,
      tools: [makeTool({ name: 'lookup', onExecute: toolRuns.bump })],
    });
    let thrown: unknown;
    try {
      await agent.run('spend money', { budget: { maxCostUsd: 0.01, onExceed: 'throw' } });
    } catch (cause) {
      thrown = cause;
    }
    ensure(
      thrown instanceof AgentBudgetExceededError,
      `run must reject with AgentBudgetExceededError, got ${String(thrown)}`,
    );
    ensure(thrown.resource === 'cost', `breach resource must be 'cost', got '${thrown.resource}'`);
    ensure(
      toolRuns.value() === 1,
      `between-step enforcement: the crossing step's tool must have run exactly once, got ${toolRuns.value()}`,
    );
    ensure(provider.calls() === 1, 'the run must stop before the second provider call');
  },
};

const hitlSuspendResume: ConformanceCheck = {
  id: 'agent.hitl-suspend-resume',
  area: 'agent',
  statement:
    'A needsApproval tool parks the run (awaiting_approval, pendingApprovals populated, ' +
    'tool NOT executed); resuming with a granted directive executes it exactly once and completes.',
  async run() {
    const executions = makeCounter();
    const provider = scriptedProvider([
      toolCallScript({ toolCallId: 'tc-mail', toolName: 'send_email', args: { q: 'hi' } }),
      textScript('email sent'),
    ]);
    const agent = createAgent({
      name: 'mailer',
      instructions: 'Send emails.',
      provider,
      tools: [
        makeTool({
          name: 'send_email',
          needsApproval: true,
          sideEffectClass: 'external-stateful',
          onExecute: executions.bump,
        }),
      ],
    });
    const first = await agent.run('email Alice');
    ensure(
      first.status === 'awaiting_approval',
      `first run must suspend with 'awaiting_approval', got '${first.status}'`,
    );
    ensure(
      first.state.pendingApprovals.some((a) => a.toolCallId === 'tc-mail'),
      'pendingApprovals must carry the gated toolCallId',
    );
    ensure(
      executions.value() === 0,
      `the gated tool must NOT execute before approval, got ${executions.value()}`,
    );

    const second = await agent.run(first.state, {
      directive: { approvals: [{ toolCallId: 'tc-mail', granted: true }] },
    });
    ensure(
      executions.value() === 1,
      `the approved tool must execute exactly once, got ${executions.value()}`,
    );
    ensure(second.status === 'completed', `the resumed run must complete, got '${second.status}'`);
    ensure(second.state.pendingApprovals.length === 0, 'no approval may stay pending after resume');
  },
};

const stateCodecRoundtrip: ConformanceCheck = {
  id: 'agent.state-codec-roundtrip',
  area: 'agent',
  statement:
    "agent.serializeState renders version-stamped 'graphorin-run-state/' JSON and " +
    'agent.deserializeState round-trips it into a state that resumes to completion.',
  async run() {
    const executions = makeCounter();
    const provider = scriptedProvider([
      toolCallScript({ toolCallId: 'tc-park', toolName: 'send_email', args: { q: 'park me' } }),
      textScript('done after restart'),
    ]);
    const agent = createAgent({
      name: 'codec',
      instructions: 'Send emails.',
      provider,
      tools: [
        makeTool({
          name: 'send_email',
          needsApproval: true,
          sideEffectClass: 'external-stateful',
          onExecute: executions.bump,
        }),
      ],
    });
    const suspended = await agent.run('park this run');
    ensure(suspended.status === 'awaiting_approval', 'fixture run must suspend on approval');

    const json = agent.serializeState(suspended.state);
    const parsed = JSON.parse(json) as { version?: unknown; status?: unknown };
    ensure(
      typeof parsed.version === 'string' && parsed.version.startsWith('graphorin-run-state/'),
      `serialized payload must be version-stamped 'graphorin-run-state/*', got '${String(parsed.version)}'`,
    );
    ensure(parsed.status === 'awaiting_approval', 'serialized payload must keep the run status');

    const rehydrated = agent.deserializeState(json);
    ensure(rehydrated.id === suspended.state.id, 'round-trip must preserve the run id');
    ensure(
      rehydrated.pendingApprovals.some((a) => a.toolCallId === 'tc-park'),
      'round-trip must preserve pendingApprovals',
    );
    const resumed = await agent.run(rehydrated, {
      directive: { approvals: [{ toolCallId: 'tc-park', granted: true }] },
    });
    ensure(
      resumed.status === 'completed' && executions.value() === 1,
      `the rehydrated state must resume to completion with exactly one execution (status '${resumed.status}', executions ${executions.value()})`,
    );
  },
};

const structuredParseGate: ConformanceCheck = {
  id: 'agent.structured-parse-gate',
  area: 'agent',
  statement:
    "An outputType schema violation fails the run with error code 'output-validation-failed' " +
    'instead of silently casting the text.',
  async run() {
    const provider = scriptedProvider([textScript('{"city": 42}')]);
    const agent = createAgent<unknown, { readonly city: string }>({
      name: 'structured',
      instructions: 'Reply with JSON.',
      provider,
      outputType: {
        kind: 'structured',
        jsonSchema: {
          type: 'object',
          properties: { city: { type: 'string' } },
          required: ['city'],
        },
        schema: {
          parse(value: unknown): { readonly city: string } {
            const record = value as { city?: unknown };
            if (typeof record.city !== 'string') {
              throw new Error('city must be a string');
            }
            return { city: record.city };
          },
        },
      },
    });
    const result = await agent.run('where do I work?');
    ensure(
      result.status === 'failed',
      `a schema-violating structured output must fail the run, got '${result.status}'`,
    );
    ensure(
      result.error?.code === 'output-validation-failed',
      `error code must be 'output-validation-failed', got '${String(result.error?.code)}'`,
    );
  },
};

const verifierRound: ConformanceCheck = {
  id: 'agent.verifier-round',
  area: 'agent',
  statement:
    'A failing ResponseVerifier costs exactly one continuation round and its feedback ' +
    'lands in state.messages as a [verifier:<id>] user message.',
  async run() {
    const provider = scriptedProvider([textScript('DRAFT: an answer'), textScript('final answer')]);
    const agent = createAgent({
      name: 'verified',
      instructions: 'Answer without draft markers.',
      provider,
      verifiers: [
        {
          id: 'no-draft',
          verify: ({ output }) =>
            output.includes('DRAFT')
              ? { ok: false, feedback: 'remove the DRAFT marker and answer again' }
              : { ok: true },
        },
      ],
    });
    const result = await agent.run('answer me');
    ensure(result.status === 'completed', `run must complete, got '${result.status}'`);
    ensure(
      result.output === 'final answer',
      `the second round's output must win, got '${result.output}'`,
    );
    ensure(
      result.state.steps.length === 2,
      `a single failing verifier must cost exactly one extra round (2 steps), got ${result.state.steps.length}`,
    );
    const feedback = result.state.messages.find(
      (m: Message) =>
        m.role === 'user' &&
        typeof m.content === 'string' &&
        m.content.includes('[verifier:no-draft]'),
    );
    ensure(
      feedback !== undefined,
      'verifier feedback must land in state.messages tagged [verifier:no-draft]',
    );
  },
};

const supersededExcluded: ConformanceCheck = {
  id: 'memory.superseded-excluded',
  area: 'memory',
  statement:
    'A superseded fact is excluded from default semantic recall; only its successor surfaces.',
  async run() {
    await withStore(async (store) => {
      const memory = createMemory({
        store: store.memory as never,
        embeddings: store.embeddings,
        resolveScope: () => SCOPE,
        conflictPipeline: { mode: 'off' },
        consolidator: { enabled: false },
      });
      const oldFact = await memory.semantic.remember(SCOPE, {
        text: 'The user lives in Munich',
        sensitivity: 'internal',
      });
      const { new: newFact } = await memory.semantic.supersede(SCOPE, oldFact.id, {
        text: 'The user lives in Milan',
        sensitivity: 'internal',
      });
      const hits = await memory.semantic.search(SCOPE, 'user lives', { topK: 10 });
      const ids = hits.map((h) => h.record.id);
      ensure(ids.includes(newFact.id), 'default recall must return the superseding fact');
      ensure(!ids.includes(oldFact.id), 'default recall must NOT return the superseded fact');
    });
  },
};

const erasureCascade: ConformanceCheck = {
  id: 'sessions.erasure-cascade',
  area: 'sessions',
  statement:
    'deleteSession cascades into session-scoped content: the session_messages row written ' +
    'for the session is gone after the delete.',
  async run() {
    await withStore(async (store) => {
      await store.sessions.createSession({
        id: SCOPE.sessionId,
        userId: SCOPE.userId,
        agentId: SCOPE.agentId,
        createdAt: new Date().toISOString(),
      });
      await store.memory.session.push(SCOPE, { role: 'user', content: 'the secret plan' });
      const count = (): number =>
        store.connection.get<{ n: number }>(
          'SELECT COUNT(*) AS n FROM session_messages WHERE scope_session_id = ?',
          [SCOPE.sessionId],
        )?.n ?? -1;
      ensure(count() === 1, `expected 1 persisted session message before delete, got ${count()}`);
      await store.sessions.deleteSession(SCOPE.sessionId);
      ensure(
        count() === 0,
        `session content must be erased by deleteSession, ${count()} row(s) left`,
      );
      const listed = await store.memory.session.list(SCOPE);
      ensure(listed.length === 0, 'the session list surface must be empty after erasure');
    });
  },
};

const checkpointCas: ConformanceCheck = {
  id: 'workflow.checkpoint-cas',
  area: 'workflow',
  statement:
    'CheckpointStore.put compare-and-set rejects a stale expectedLatestId with ' +
    'CheckpointConflictError naming the actual latest checkpoint.',
  async run() {
    await withStore(async (store) => {
      const threadId = 'conformance-thread';
      const namespace = 'agent';
      const fixture = (stepNumber: number): Checkpoint => ({
        id: `cp-${stepNumber}`,
        threadId,
        namespace,
        state: { stepNumber },
        channelVersions: {},
        stepNumber,
        createdAt: new Date().toISOString(),
      });
      const metadata: CheckpointMetadata = { source: 'sync', status: 'suspended' };
      await store.checkpoints.put(threadId, namespace, fixture(1), metadata, {
        expectedLatestId: null,
      });
      await store.checkpoints.put(threadId, namespace, fixture(2), metadata, {
        expectedLatestId: 'cp-1',
      });
      let thrown: unknown;
      try {
        await store.checkpoints.put(threadId, namespace, fixture(3), metadata, {
          expectedLatestId: 'cp-1',
        });
      } catch (cause) {
        thrown = cause;
      }
      ensure(
        thrown instanceof CheckpointConflictError,
        `a stale expectedLatestId must throw CheckpointConflictError, got ${String(thrown)}`,
      );
      ensure(
        thrown.actualLatestId === 'cp-2',
        `the conflict must name the actual latest id 'cp-2', got '${String(thrown.actualLatestId)}'`,
      );
    });
  },
};

const secretRedaction: ConformanceCheck = {
  id: 'security.secret-redaction',
  area: 'security',
  statement:
    'SecretValue redacts String()/template/JSON.stringify/util.inspect and reveals the ' +
    'raw value only inside .use().',
  async run() {
    const raw = 'conformance-raw-token-a1b2c3';
    const secret = SecretValue.fromString(raw);
    const surfaces: ReadonlyArray<readonly [string, string]> = [
      ['String(secret)', String(secret)],
      ['template literal', `${secret}`],
      ['JSON.stringify', JSON.stringify({ apiKey: secret })],
      ['util.inspect', inspect(secret)],
    ];
    for (const [name, rendered] of surfaces) {
      ensure(!rendered.includes(raw), `${name} must not leak the raw secret (got '${rendered}')`);
    }
    const seen = await secret.use(async (value) => value);
    ensure(seen === raw, '.use() must hand the callback the raw value');
  },
};

/** Minimal in-memory AuditDb - the contract surface the verifier needs. */
function inMemoryAuditDb(): AuditDb & { readonly entries: StoredAuditEntry[] } {
  const entries: StoredAuditEntry[] = [];
  return {
    binding: 'conformance-in-memory',
    path: ':memory:',
    entries,
    insert: async (entry) => {
      entries.push(entry);
      return entry;
    },
    latest: async () => entries[entries.length - 1],
    iterate: async function* (bounds) {
      for (const entry of entries) {
        if (bounds?.fromSeq !== undefined && entry.seq < bounds.fromSeq) continue;
        if (bounds?.toSeq !== undefined && entry.seq > bounds.toSeq) continue;
        yield entry;
      }
    },
    count: async () => entries.length,
    deleteUpTo: async (threshold) => {
      const before = entries.length;
      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        if (entry !== undefined && entry.seq <= threshold) entries.splice(i, 1);
      }
      return before - entries.length;
    },
    replaceEntry: async (entry) => {
      const index = entries.findIndex((e) => e.seq === entry.seq);
      if (index !== -1) entries[index] = entry;
    },
    close: async () => {},
  };
}

const auditChain: ConformanceCheck = {
  id: 'security.audit-chain',
  area: 'security',
  statement:
    "The audit log's hash chain verifies clean over appended entries and detects a " +
    'tampered row at its exact sequence number.',
  async run() {
    const db = inMemoryAuditDb();
    const actor = { kind: 'system', id: 'conformance' } as const;
    await appendAudit(db, { actor, action: 'secret:get', target: 'k1', decision: 'success' });
    await appendAudit(db, { actor, action: 'secret:get', target: 'k2', decision: 'denied' });
    await appendAudit(db, { actor, action: 'token:create', target: 't1', decision: 'success' });

    const clean = await verifyAuditChain(db);
    ensure(clean.ok, 'an untampered chain must verify clean');
    ensure(clean.count === 3, `verification must traverse all 3 entries, got ${clean.count}`);

    const victim = db.entries[1];
    ensure(victim !== undefined, 'fixture must have a second entry');
    db.entries[1] = { ...victim, target: 'k2-tampered' };
    const tampered = await verifyAuditChain(db);
    ensure(!tampered.ok, 'a tampered row must break chain verification');
    ensure(
      tampered.brokenAt === 2,
      `the break must be reported at seq 2, got ${tampered.brokenAt}`,
    );
  },
};

const suspendedRunDurability: ConformanceCheck = {
  id: 'server.suspended-run-durability',
  area: 'server',
  statement:
    "RunStateTracker's persistence hooks fire on suspend (with the retained state) and " +
    'drop the durable row when the suspended run settles.',
  async run() {
    const suspendedCalls: Array<{ runId: string; descriptor: RunDescriptor; state: unknown }> = [];
    const settledCalls: string[] = [];
    const tracker = new RunStateTracker();
    tracker.setSuspendedRunPersistence({
      suspended: (runId, descriptor, state) => {
        suspendedCalls.push({ runId, descriptor, state });
      },
      settled: (runId) => {
        settledCalls.push(runId);
      },
    });
    const descriptor: RunDescriptor = { kind: 'agent', agentId: 'conformance-agent' };
    tracker.start('run-durable', descriptor);
    const parkedState = { marker: 'suspended-run-state' };
    tracker.suspend('run-durable', parkedState);
    ensure(
      suspendedCalls.length === 1,
      `suspend must fire the persistence hook once, got ${suspendedCalls.length}`,
    );
    ensure(
      suspendedCalls[0]?.runId === 'run-durable' && suspendedCalls[0]?.state === parkedState,
      'the suspended hook must receive the runId and the retained state verbatim',
    );
    ensure(
      tracker.snapshot('run-durable')?.status === 'awaiting_approval',
      "a suspended run must snapshot as 'awaiting_approval'",
    );
    ensure(
      tracker.suspendedStateOf('run-durable') === parkedState,
      'the tracker must retain the suspended state for the resume endpoint',
    );
    tracker.complete('run-durable', 'completed');
    ensure(
      settledCalls.length === 1 && settledCalls[0] === 'run-durable',
      'settling the suspended run must fire the settled hook exactly once',
    );
    ensure(
      tracker.suspendedStateOf('run-durable') === undefined,
      'a settled run must keep no suspended state',
    );
  },
};

const pricingDatedAlias: ConformanceCheck = {
  id: 'pricing.dated-alias',
  area: 'pricing',
  statement:
    'lookupPrice resolves a dated model id (a -YYYYMMDD suffix) through its dateless ' +
    'alias entry with identical per-token rates.',
  async run() {
    const dated = lookupPrice({ provider: 'anthropic', model: 'claude-haiku-4-5-20251001' });
    ensure(dated !== null, 'the dated id must resolve through the dateless alias, got null');
    const alias = lookupPrice({ provider: 'anthropic', model: 'claude-haiku-4-5' });
    ensure(alias !== null, 'the dateless alias entry itself must resolve');
    ensure(
      dated.inputUsdPerToken === alias.inputUsdPerToken &&
        dated.outputUsdPerToken === alias.outputUsdPerToken,
      'the dated resolution must carry the alias entry rates verbatim',
    );
  },
};

/**
 * The framework floor. Order groups by area; every check is
 * self-contained and safe to run in any order.
 */
export const CONFORMANCE_CHECKS: ReadonlyArray<ConformanceCheck> = Object.freeze([
  streamEventGrammar,
  budgetPrecheck,
  hitlSuspendResume,
  stateCodecRoundtrip,
  structuredParseGate,
  verifierRound,
  supersededExcluded,
  erasureCascade,
  checkpointCas,
  secretRedaction,
  auditChain,
  suspendedRunDurability,
  pricingDatedAlias,
]);
