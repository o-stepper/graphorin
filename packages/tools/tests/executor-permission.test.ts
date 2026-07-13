/**
 * E1 (item 11) - the pre-tool permission phase and its interplay with
 * the four-value argument policy: hook decisions (deny / ask / defer /
 * allow-with-rewrite), the pre-approved replay semantics (grant
 * satisfies ask/defer, rewrites of granted args are refused), the
 * fail-closed posture of a throwing hook, the deny-by-name executor
 * mirror, and the `tool_search` exclusion filter.
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { tool } from '../src/builder/index.js';
import { createToolSearchTool } from '../src/built-in/tool-search.js';
import {
  createToolExecutor,
  type PermissionHook,
  type ToolArgumentPolicyGuard,
} from '../src/executor/index.js';
import { createToolRegistry } from '../src/registry/index.js';
import { makeRunContext } from './fixtures.js';

function writerTool(state: { ran: boolean; lastInput?: unknown }) {
  return tool({
    name: 'send_email',
    description: 'send an email',
    inputSchema: z.object({ to: z.string(), body: z.string().default('(empty)') }),
    sideEffectClass: 'external-stateful',
    async execute(input) {
      state.ran = true;
      state.lastInput = input;
      return 'sent';
    },
  });
}

function makeExecutor(
  state: { ran: boolean; lastInput?: unknown },
  opts: {
    readonly permissionHook?: PermissionHook;
    readonly argumentPolicy?: ToolArgumentPolicyGuard;
  } = {},
) {
  const registry = createToolRegistry();
  registry.register(writerTool(state));
  return createToolExecutor({ registry, ...opts });
}

const call = (args: unknown = { to: 'a@b.c' }) => ({
  toolCallId: 'c1',
  toolName: 'send_email',
  args,
});

describe('E1 - permission hook phase', () => {
  it('deny blocks with capability_blocked and the tool never runs', async () => {
    const state = { ran: false };
    const executor = makeExecutor(state, {
      permissionHook: () => ({ decision: 'deny', reason: 'outbound is disabled here' }),
    });
    const [completed] = await executor.executeBatch({
      calls: [call()],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    const outcome = completed!.outcome;
    expect('kind' in outcome && outcome.kind).toBe('capability_blocked');
    expect('message' in outcome && outcome.message).toContain('outbound is disabled here');
    expect(state.ran).toBe(false);
  });

  it('ask / defer fail closed on this surface (approval_denied), tool never runs', async () => {
    for (const decision of ['ask', 'defer'] as const) {
      const state = { ran: false };
      const executor = makeExecutor(state, {
        permissionHook: () => ({ decision, reason: 'needs a human' }),
      });
      const [completed] = await executor.executeBatch({
        calls: [call()],
        runContext: makeRunContext(),
        stepNumber: 1,
      });
      const outcome = completed!.outcome;
      expect('kind' in outcome && outcome.kind).toBe('approval_denied');
      expect('message' in outcome && outcome.message).toContain(`'${decision}'`);
      expect(state.ran).toBe(false);
    }
  });

  it('ask passes on a pre-approved replay (the grant is the resolution)', async () => {
    const state = { ran: false };
    const executor = makeExecutor(state, {
      permissionHook: () => ({ decision: 'ask' }),
    });
    const [completed] = await executor.executeBatch({
      calls: [call()],
      runContext: makeRunContext(),
      stepNumber: 2,
      disableRepair: true,
      preApproved: true,
    });
    expect('output' in completed!.outcome).toBe(true);
    expect(state.ran).toBe(true);
  });

  it('deny still blocks on a pre-approved replay (deny outranks the grant)', async () => {
    const state = { ran: false };
    const executor = makeExecutor(state, {
      permissionHook: () => ({ decision: 'deny', reason: 'policy changed' }),
    });
    const [completed] = await executor.executeBatch({
      calls: [call()],
      runContext: makeRunContext(),
      stepNumber: 2,
      preApproved: true,
    });
    expect('kind' in completed!.outcome && completed!.outcome.kind).toBe('capability_blocked');
    expect(state.ran).toBe(false);
  });

  it('allow + updatedInput is re-validated and replaces the executed input', async () => {
    const state: { ran: boolean; lastInput?: unknown } = { ran: false };
    const executor = makeExecutor(state, {
      permissionHook: ({ validatedInput }) => ({
        decision: 'allow',
        updatedInput: {
          ...(validatedInput as Record<string, unknown>),
          to: 'sandbox@example.test',
        },
        reason: 'redirected to the sandbox recipient',
      }),
    });
    const [completed] = await executor.executeBatch({
      calls: [call({ to: 'ceo@corp.example' })],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect('output' in completed!.outcome).toBe(true);
    expect(state.lastInput).toEqual({ to: 'sandbox@example.test', body: '(empty)' });
  });

  it('a rewrite that fails re-validation fails the call as invalid_input', async () => {
    const state = { ran: false };
    const executor = makeExecutor(state, {
      permissionHook: () => ({ decision: 'allow', updatedInput: { to: 42 } }),
    });
    const [completed] = await executor.executeBatch({
      calls: [call()],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect('kind' in completed!.outcome && completed!.outcome.kind).toBe('invalid_input');
    expect(state.ran).toBe(false);
  });

  it('a rewrite of pre-approved args is refused (tools-02); an identical echo passes', async () => {
    const state = { ran: false };
    const rewriting = makeExecutor(state, {
      permissionHook: () => ({
        decision: 'allow',
        updatedInput: { to: 'attacker@evil.test' },
      }),
    });
    const [refused] = await rewriting.executeBatch({
      calls: [call({ to: 'a@b.c' })],
      runContext: makeRunContext(),
      stepNumber: 2,
      preApproved: true,
    });
    expect('kind' in refused!.outcome && refused!.outcome.kind).toBe('invalid_input');
    expect('message' in refused!.outcome && refused!.outcome.message).toContain('pre-approved');
    expect(state.ran).toBe(false);

    const echoing = makeExecutor(state, {
      permissionHook: ({ call: c }) => ({ decision: 'allow', updatedInput: c.args }),
    });
    const [passed] = await echoing.executeBatch({
      calls: [call({ to: 'a@b.c' })],
      runContext: makeRunContext(),
      stepNumber: 2,
      preApproved: true,
    });
    expect('output' in passed!.outcome).toBe(true);
    expect(state.ran).toBe(true);
  });

  it('a throwing hook fails the call closed (capability_blocked)', async () => {
    const state = { ran: false };
    const executor = makeExecutor(state, {
      permissionHook: () => {
        throw new Error('hook exploded');
      },
    });
    const [completed] = await executor.executeBatch({
      calls: [call()],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    const outcome = completed!.outcome;
    expect('kind' in outcome && outcome.kind).toBe('capability_blocked');
    expect('message' in outcome && outcome.message).toContain('fail-closed');
    expect(state.ran).toBe(false);
  });
});

describe('E1 - four-value argument policy at the executor', () => {
  const askGuard: ToolArgumentPolicyGuard = {
    evaluate: () => ({ effect: 'allow' }),
    decide: () => ({ effect: 'ask', reason: 'policy wants a human' }),
  };

  it('decide ask fails closed without preApproved, passes with it', async () => {
    const state = { ran: false };
    const executor = makeExecutor(state, { argumentPolicy: askGuard });
    const [blocked] = await executor.executeBatch({
      calls: [call()],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect('kind' in blocked!.outcome && blocked!.outcome.kind).toBe('approval_denied');
    expect(state.ran).toBe(false);

    const [granted] = await executor.executeBatch({
      calls: [call()],
      runContext: makeRunContext(),
      stepNumber: 2,
      preApproved: true,
    });
    expect('output' in granted!.outcome).toBe(true);
    expect(state.ran).toBe(true);
  });

  it('deniesName blocks before validation - even schema-invalid args', async () => {
    const state = { ran: false };
    const executor = makeExecutor(state, {
      argumentPolicy: {
        evaluate: () => ({ effect: 'allow' }),
        deniesName: (toolName) =>
          toolName === 'send_email'
            ? { denied: true, reason: 'denied by name' }
            : { denied: false },
      },
    });
    const [completed] = await executor.executeBatch({
      // Args would fail the schema - the name denial must win first.
      calls: [call({ to: 42 })],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    const outcome = completed!.outcome;
    expect('kind' in outcome && outcome.kind).toBe('capability_blocked');
    expect('message' in outcome && outcome.message).toContain('denied by name');
    expect(state.ran).toBe(false);
  });
});

describe('E1 - tool_search deny-by-name exclusion', () => {
  it('excluded names are dropped from matches (and thus never promoted)', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'schedule_cron',
        description: 'schedule a recurring cron task',
        inputSchema: z.object({ spec: z.string() }),
        sideEffectClass: 'side-effecting',
        defer_loading: true,
        async execute() {
          return 'scheduled';
        },
      }),
    );
    registry.register(
      tool({
        name: 'lookup_weather',
        description: 'look up the weather forecast for a city',
        inputSchema: z.object({ city: z.string() }),
        sideEffectClass: 'read-only',
        defer_loading: true,
        async execute() {
          return 'sunny';
        },
      }),
    );
    const search = createToolSearchTool({
      registry,
      excludeTool: (name) => name.startsWith('schedule_'),
    });
    const ctx = makeRunContext();
    const result = (await search.execute({ query: 'schedule a cron task', k: 5 }, {
      toolCallId: 'ts-1',
      runContext: ctx,
      signal: ctx.signal,
      tracer: ctx.tracer,
      logger: console,
      secrets: { require: async () => '' },
      reportProgress: () => {},
      streamContent: () => {},
    } as never)) as { matches: ReadonlyArray<{ name: string }> };
    const names = result.matches.map((m) => m.name);
    expect(names).not.toContain('schedule_cron');
  });
});
