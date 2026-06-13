/**
 * Graphorin v0.5.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Smoke coverage for `examples/multi-agent-crew`. Exercises every
 * RB-33 acceptance scenario against the deterministic stub provider so
 * CI never depends on a live LLM:
 *
 *  1. JSONL export contains both `kind: 'agent'` and `kind: 'handoff'` records.
 *  2. `session.list({ agentId: 'worker-a' })` filters per-agent attribution.
 *  3. `session.replay(...)` reconstructs the registry with placeholder
 *     support after `agents.delete(...)`.
 *  4. The supervisor invoking `transfer_to_<worker>` auto-fires a
 *     {@link HandoffRecord} per transfer.
 *  5. Sub-agent secrets isolation per DEC-137: the supervisor mounts a
 *     `SecretValue`; workers cannot read it (default `inheritSecrets: []`).
 *  6. Handoff `inputFilter` defaults: `lastN(10) + stripReasoning`
 *     (compose descriptor) per DEC-146 / RB-40.
 */

import type { HandoffInputFilterDescriptor, ToolExecutionContext } from '@graphorin/core';
import {
  readSessionExport,
  type SessionExportAgentRecord,
  type SessionExportHandoffRecord,
} from '@graphorin/sessions';
import { describe, expect, it } from 'vitest';
import {
  buildDefaultHandoffFilter,
  buildReadSecretTool,
  type CrewDeps,
  describeAgentForReplay,
  exportSessionJsonl,
  runCrew,
  VERSION,
} from '../src/main.js';
import { WORKER_NAMES } from '../src/stub-provider.js';

interface ComposeDescriptorMeta {
  readonly steps: ReadonlyArray<HandoffInputFilterDescriptor>;
}

function composeMeta(descriptor: HandoffInputFilterDescriptor): ComposeDescriptorMeta {
  return descriptor.meta as unknown as ComposeDescriptorMeta;
}

/**
 * Build the smallest mock {@link ToolExecutionContext} that the
 * `read-secret-from-deps` tool actually reads from. The only field the
 * tool dereferences is `runContext.deps`, so the rest of the surface
 * is filled with no-op shims and cast through `unknown`.
 */
function makeToolContext<TDeps>(deps: TDeps): ToolExecutionContext<TDeps> {
  const ctx = {
    toolCallId: 'tc-smoke',
    runContext: { deps },
    signal: new AbortController().signal,
    tracer: { startSpan: () => ({ end: () => {} }) },
    logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
    secrets: {
      require: () => {
        throw new Error('smoke test does not wire a real secrets accessor');
      },
    },
    reportProgress: () => {},
    streamContent: () => {},
  };
  return ctx as unknown as ToolExecutionContext<TDeps>;
}

describe('examples/multi-agent-crew — smoke', () => {
  it('exposes VERSION = 0.5.0', () => {
    expect(VERSION).toBe('0.5.0');
  });

  it('runCrew streams supervisor + 2 workers and produces a joined synthesis', async () => {
    const handle = await runCrew({ recipe: 'stub' });
    try {
      expect(handle.output.length).toBeGreaterThan(0);
      expect(handle.output).toContain('researcher said');
      expect(handle.output).toContain('writer said');
      expect(handle.output).toContain('[researched]');
      expect(handle.output).toContain('[written]');
      expect(handle.handoffs.length).toBe(2);
      expect(handle.handoffs[0]?.fromAgentId).toBe('supervisor');
      expect(handle.handoffs[0]?.toAgentId).toBe(WORKER_NAMES.researcher);
      expect(handle.handoffs[1]?.toAgentId).toBe(WORKER_NAMES.writer);
    } finally {
      await handle.close();
    }
  });

  it('JSONL export carries kind: agent AND kind: handoff records', async () => {
    const handle = await runCrew({ recipe: 'stub' });
    try {
      const { body, footer, lines } = await exportSessionJsonl(handle.session);
      expect(footer.kind).toBe('footer');
      expect(footer.agentCount).toBeGreaterThanOrEqual(3);
      expect(footer.handoffCount).toBe(2);
      expect(lines.length).toBeGreaterThan(0);

      const parsed = readSessionExport(body, {});
      const agentRecords = parsed.records.filter(
        (r): r is SessionExportAgentRecord => r.kind === 'agent',
      );
      const handoffRecords = parsed.records.filter(
        (r): r is SessionExportHandoffRecord => r.kind === 'handoff',
      );
      const agentIds = agentRecords.map((r) => r.id);
      expect(agentIds).toContain('supervisor');
      expect(agentIds).toContain(WORKER_NAMES.researcher);
      expect(agentIds).toContain(WORKER_NAMES.writer);
      expect(handoffRecords.length).toBe(2);
      const transitions = handoffRecords.map((h) => `${h.fromAgentId}->${h.toAgentId}`);
      expect(transitions).toEqual([
        `supervisor->${WORKER_NAMES.researcher}`,
        `supervisor->${WORKER_NAMES.writer}`,
      ]);
    } finally {
      await handle.close();
    }
  });

  it('session.list({ agentId: "worker-a" }) returns ONLY worker-a assistant messages', async () => {
    const handle = await runCrew({ recipe: 'stub' });
    try {
      const onlyResearcher = await handle.session.list({ agentId: WORKER_NAMES.researcher });
      expect(onlyResearcher.length).toBeGreaterThan(0);
      for (const msg of onlyResearcher) {
        expect(msg.role).toBe('assistant');
        if (msg.role === 'assistant') {
          expect(msg.agentId).toBe(WORKER_NAMES.researcher);
        }
      }
      // Sanity check: writer + supervisor messages are NOT in this filtered list.
      const supervisorList = await handle.session.list({ agentId: 'supervisor' });
      const writerList = await handle.session.list({ agentId: WORKER_NAMES.writer });
      expect(
        supervisorList.every((m) => m.role !== 'assistant' || m.agentId === 'supervisor'),
      ).toBe(true);
      expect(
        writerList.every((m) => m.role !== 'assistant' || m.agentId === WORKER_NAMES.writer),
      ).toBe(true);
    } finally {
      await handle.close();
    }
  });

  it('session.replay() runs to completion after agents.delete(writer); placeholder reconstructs', async () => {
    const handle = await runCrew({ recipe: 'stub' });
    try {
      // Pre-delete sanity: writer is registered.
      const before = await handle.sessionManager.agents.resolveOrPlaceholder(WORKER_NAMES.writer);
      expect(before.kind).toBe('agent');

      await handle.sessionManager.agents.delete(WORKER_NAMES.writer);

      const after = await handle.sessionManager.agents.resolveOrPlaceholder(WORKER_NAMES.writer);
      expect(after.kind).toBe('unknown');
      const placeholder = await describeAgentForReplay(
        handle.sessionManager.agents,
        WORKER_NAMES.writer,
      );
      expect(placeholder).toBe(`<deleted:${WORKER_NAMES.writer}>`);

      // Replay still runs to completion against the deleted-agent registry.
      const replayEvents: string[] = [];
      for await (const ev of handle.session.replay()) {
        replayEvents.push(ev.type);
      }
      expect(replayEvents).toContain('replay.start');
      expect(replayEvents[replayEvents.length - 1]).toBe('replay.end');

      // The other agents are still resolvable.
      const supervisor = await handle.sessionManager.agents.resolveOrPlaceholder('supervisor');
      expect(supervisor.kind).toBe('agent');
      const researcher = await handle.sessionManager.agents.resolveOrPlaceholder(
        WORKER_NAMES.researcher,
      );
      expect(researcher.kind).toBe('agent');
    } finally {
      await handle.close();
    }
  });

  it('first HandoffRecord.inputFilter is the compose(lastN(10), stripReasoning) descriptor', async () => {
    const handle = await runCrew({ recipe: 'stub' });
    try {
      const first = handle.handoffs[0];
      expect(first).toBeDefined();
      expect(first?.inputFilter?.kind).toBe('compose');
      expect(first?.secretsInheritance).toBe('inherit-allowlist');
      expect(first?.inheritedSecrets).toEqual([]);

      const meta = composeMeta(first?.inputFilter as HandoffInputFilterDescriptor);
      const stepKinds = meta.steps.map((s) => s.kind);
      expect(stepKinds).toContain('last-n');
      expect(stepKinds).toContain('strip-reasoning');

      const lastN = meta.steps.find((s) => s.kind === 'last-n');
      expect((lastN?.meta as unknown as { n: number }).n).toBe(10);

      // Cross-check the directly built filter descriptor matches the
      // record stored on the session.
      const reference = buildDefaultHandoffFilter().descriptor;
      expect(reference.kind).toBe('compose');
      const refSteps = composeMeta(reference).steps.map((s) => s.kind);
      expect(refSteps).toEqual(stepKinds);
    } finally {
      await handle.close();
    }
  });

  it('sub-agent secrets isolation: supervisor sees the secret, workers default to <no-secret>', async () => {
    const handle = await runCrew({ recipe: 'stub' });
    try {
      // The supervisor's deps carry the SecretValue.
      const supervisorDeps: CrewDeps = handle.supervisor.config.deps as CrewDeps;
      expect(supervisorDeps?.secret).toBeDefined();
      expect(supervisorDeps?.secret?.length).toBeGreaterThan(0);
      // Every leakage barrier returns the placeholder.
      expect(String(supervisorDeps?.secret)).toBe('[SECRET]');
      expect(JSON.stringify({ s: supervisorDeps?.secret })).toBe('{"s":"[SECRET]"}');

      // Workers ship `deps: undefined` by default — DEC-137 empty allowlist.
      expect(handle.workers.researcher.config.deps).toBeUndefined();
      expect(handle.workers.writer.config.deps).toBeUndefined();

      // The shared `read-secret-from-deps` tool reflects the invariant
      // when invoked under each agent's deps surface.
      const tool = buildReadSecretTool();
      const supervisorReport = await tool.execute({}, makeToolContext<CrewDeps>(supervisorDeps));
      const workerReport = await tool.execute(
        {},
        makeToolContext<CrewDeps>(undefined as unknown as CrewDeps),
      );
      expect(supervisorReport).toMatch(/^secret-len=\d+$/);
      expect(workerReport).toBe('<no-secret>');
    } finally {
      await handle.close();
    }
  });
});
