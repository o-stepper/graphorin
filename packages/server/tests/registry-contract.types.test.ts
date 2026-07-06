/**
 * W-053: compile-time compatibility gate between the real `Agent` /
 * `Workflow` surfaces and the server's structural `ServerAgentLike` /
 * `ServerWorkflowLike`. The registry types are DOCUMENTED as compatible
 * but nothing asserted it - a drifted `agent.stream` signature or
 * workflow member compiled silently and failed only in a user's
 * runtime. This file is executed by the test run AND typechecked by the
 * tests tsconfig (CS-4), so an intentional break fails `pnpm typecheck`
 * for the server package.
 */
import type { Agent } from '@graphorin/agent';
import type { Workflow } from '@graphorin/workflow';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ServerAgentLike, ServerWorkflowLike } from '../src/registry/index.js';

describe('W-053 - server registry compile-time contract', () => {
  it('Agent satisfies ServerAgentLike (including the optional stream surface)', () => {
    expectTypeOf<Agent>().toExtend<ServerAgentLike>();
    expectTypeOf<Agent['stream']>().toExtend<NonNullable<ServerAgentLike['stream']>>();
    // Self-documenting assignability anchor: a real Agent IS registrable.
    const _agent: ServerAgentLike = {} as Agent;
    void _agent;
    expect(true).toBe(true);
  });

  it('Workflow satisfies ServerWorkflowLike (including the optional members)', () => {
    expectTypeOf<Workflow>().toExtend<ServerWorkflowLike>();
    expectTypeOf<Workflow['execute']>().toExtend<ServerWorkflowLike['execute']>();
    expectTypeOf<Workflow['resume']>().toExtend<ServerWorkflowLike['resume']>();
    expectTypeOf<Workflow['retry']>().toExtend<ServerWorkflowLike['retry']>();
    expectTypeOf<Workflow['tick']>().toExtend<ServerWorkflowLike['tick']>();
    expectTypeOf<Workflow['getState']>().toExtend<ServerWorkflowLike['getState']>();
    expectTypeOf<Workflow['listCheckpoints']>().toExtend<ServerWorkflowLike['listCheckpoints']>();
    const _workflow: ServerWorkflowLike = {} as Workflow;
    void _workflow;
    expect(true).toBe(true);
  });
});
