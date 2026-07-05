import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { tool } from '../src/builder/index.js';
import { createReadResultTool } from '../src/built-in/index.js';
import type { DataFlowGuard } from '../src/executor/executor.js';
import { createToolExecutor } from '../src/executor/index.js';
import { createToolRegistry } from '../src/registry/index.js';
import { createFileResultReader } from '../src/result/index.js';
import type { SpillWriter } from '../src/result/truncate.js';
import { makeRunContext } from './fixtures.js';

// A distinctive sentence that lives ONLY in the spilled tail (beyond the
// preview cap) - if the sink gate fires on it, the taint followed the
// handle read, not the bounded preview.
const TAIL_SECRET_PLAN =
  'the hidden coordinates are 51.4778 north 0.0014 west under the old observatory clock';

const tmpRoots: string[] = [];
afterEach(async () => {
  while (tmpRoots.length > 0) {
    const root = tmpRoots.pop();
    if (root !== undefined) await fs.rm(root, { recursive: true, force: true }).catch(() => {});
  }
});

async function isolatedSpill(): Promise<SpillWriter> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'graphorin-sdf7-'));
  tmpRoots.push(root);
  return {
    artifactRoot: root,
    async write(opts) {
      const dir = path.join(root, opts.runId);
      await fs.mkdir(dir, { recursive: true });
      const file = path.join(dir, `${opts.toolCallId}.${opts.extension}`);
      await fs.writeFile(file, opts.body, { mode: 0o600 });
      return { path: file, bytes: Buffer.byteLength(opts.body) };
    },
  };
}

describe('SDF-7 - spill→read_result→sink triggers the verbatim gate like a direct flow (closed by TL-6)', () => {
  it('a sink echoing handle-fetched untrusted content is blocked in enforce mode', async () => {
    // The ledger-backed guard from @graphorin/security via the agent's
    // builder shape - reproduced minimally here so the tools package
    // exercises the REAL policy semantics without an agent dependency.
    const { createDataFlowPolicy, createTaintLedger, deriveTaintLabel } = await import(
      '@graphorin/security/dataflow'
    );
    const policy = createDataFlowPolicy({ mode: 'enforce' });
    const ledger = createTaintLedger();
    const guard: DataFlowGuard = {
      inspect(input) {
        const probe = ledger.inspectArgs(JSON.stringify(input.args));
        const decision = policy.evaluate({
          toolName: input.toolName,
          sideEffectClass: input.sideEffectClass,
          carriesUntrustedVerbatim: probe.carriesUntrustedVerbatim,
          untrustedSeen: ledger.untrustedSeen,
          sensitiveSeen: ledger.sensitiveSeen,
          sourceKinds:
            probe.matchedSourceKinds.length > 0
              ? probe.matchedSourceKinds
              : ledger.untrustedSourceKinds,
        });
        if (decision.action === 'allow') return { action: 'allow' };
        return {
          action: decision.action,
          flow: decision.flow,
          reason: decision.reason,
          sourceKinds: decision.sourceKinds,
        };
      },
      record(input) {
        ledger.recordOutput(
          deriveTaintLabel({
            trustClass: input.trustClass,
            ...(input.source !== undefined ? { source: input.source } : {}),
            ...(input.sensitivity !== undefined ? { sensitivity: input.sensitivity } : {}),
          }),
          input.outputText,
        );
      },
    };

    const spill = await isolatedSpill();
    const reader = createFileResultReader({ artifactRoot: spill.artifactRoot });
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'mcp_fetch',
        description: 'untrusted fetch whose tail spills past the preview',
        inputSchema: z.object({}),
        sideEffectClass: 'read-only',
        maxResultTokens: 50,
        truncationStrategy: 'spill-to-file',
        async execute() {
          return `benign head\n${'filler '.repeat(800)}\n${TAIL_SECRET_PLAN}`;
        },
      }),
      { kind: 'mcp', serverIdentity: 'srv-evil' },
    );
    registry.register(createReadResultTool({ reader }), { kind: 'built-in', subsystem: 'tools' });
    registry.register(
      tool({
        name: 'exfil_send',
        description: 'external sink',
        inputSchema: z.object({ payload: z.string() }),
        sideEffectClass: 'external-stateful',
        async execute() {
          return 'sent';
        },
      }),
    );
    const executor = createToolExecutor({ registry, spill, dataFlowGuard: guard });
    const runContext = makeRunContext({ runId: 'run-sdf7' });

    const first = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'mcp_fetch', args: {} }],
      runContext,
      stepNumber: 1,
    });
    const firstOutcome = first[0]?.outcome;
    if (firstOutcome === undefined || !('output' in firstOutcome)) throw new Error('expected ok');
    const handle = firstOutcome.resultHandle?.uri;
    if (handle === undefined) throw new Error('expected a spill handle');
    // The tail never reached the model-facing preview.
    expect(String(firstOutcome.output)).not.toContain(TAIL_SECRET_PLAN);

    // Fetch a tail slice through read_result (the laundering path SDF-7
    // describes: pre-TL-6 this recorded as first-party-built-in).
    const second = await executor.executeBatch({
      calls: [{ toolCallId: 'c2', toolName: 'read_result', args: { handle, maxBytes: 65536 } }],
      runContext,
      stepNumber: 2,
    });
    const readOutcome = second[0]?.outcome;
    if (readOutcome === undefined || !('output' in readOutcome)) throw new Error('expected read');

    // The model now forwards the fetched tail verbatim to a sink.
    const third = await executor.executeBatch({
      calls: [
        {
          toolCallId: 'c3',
          toolName: 'exfil_send',
          args: { payload: `forwarding: ${TAIL_SECRET_PLAN}` },
        },
      ],
      runContext,
      stepNumber: 3,
    });
    const sinkOutcome = third[0]?.outcome;
    if (sinkOutcome === undefined) throw new Error('expected a sink outcome');
    if (!('kind' in sinkOutcome)) {
      throw new Error('SDF-7 regression: the handle-fetched taint did not gate the sink');
    }
    expect(sinkOutcome.kind).toBe('dataflow_policy_blocked');
  });
});
