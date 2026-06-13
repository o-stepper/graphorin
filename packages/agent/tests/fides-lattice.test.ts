/**
 * FIDES-lattice (SDF-8) agent wiring: `DataFlowPolicyConfig.treatPiiAsSensitive`
 * threads `containsPii` into the run's taint ledger, so a tool emitting PII —
 * tagged only `'internal'`, not `'secret'` — arms the lethal-trifecta `sensitive`
 * leg. Default off ⇒ byte-identical.
 */

import type { RunContext } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { buildDataFlowGuard } from '../src/tooling/dataflow.js';

const runContext = { runId: 'r1' } as unknown as RunContext;

function recordPiiOutput(guard: ReturnType<typeof buildDataFlowGuard>): void {
  guard.record({
    toolName: 'reader',
    trustClass: 'first-party-built-in',
    sensitivity: 'internal', // NOT secret
    outputText: 'customer SSN 123-45-6789',
    runContext,
  });
}

describe('FIDES-lattice: agent treatPiiAsSensitive wiring', () => {
  it('arms sensitiveSeen on a PII read when treatPiiAsSensitive is on', () => {
    const guard = buildDataFlowGuard({ mode: 'shadow', treatPiiAsSensitive: true });
    recordPiiOutput(guard);
    expect(guard.snapshotLedger('r1')?.sensitiveSeen).toBe(true);
  });

  it('leaves sensitiveSeen false by default (treatPiiAsSensitive off)', () => {
    const guard = buildDataFlowGuard({ mode: 'shadow' });
    recordPiiOutput(guard);
    expect(guard.snapshotLedger('r1')?.sensitiveSeen).toBe(false);
  });
});
