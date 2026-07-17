/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Acceptance suite for the structured-verifier example: the C3 verifier
 * continuation round, the zod parse gate (typed success AND the
 * `output-validation-failed` failure), the wire-schema forwarding
 * contract, and the `maxVerifierRounds` bound.
 */

import { describe, expect, it } from 'vitest';
import {
  CITY_FACTS_JSON_SCHEMA,
  createExtractionAgent,
  noPlaceholders,
  runExtraction,
} from '../src/main.js';
import { createScriptedProvider } from '../src/stub-provider.js';

describe('structured-verifier example', () => {
  it('verifier bounces the placeholder draft once, then the zod gate types the output', async () => {
    const run = await runExtraction();
    expect(run.facts).toEqual({ city: 'Tokyo', population: 37400000 });
    // Exactly one continuation round: 2 provider calls, 1 feedback message.
    expect(run.providerCalls).toBe(2);
    expect(run.verifierFeedback).toHaveLength(1);
    expect(run.verifierFeedback[0]).toContain('[verifier:no-placeholders]');
    expect(run.verifierFeedback[0]).toContain('UNKNOWN placeholder');
  });

  it('forwards the closed jsonSchema on EVERY provider request (wire contract)', async () => {
    const run = await runExtraction();
    expect(run.stub.requests.length).toBe(2);
    for (const request of run.stub.requests) {
      expect(request.outputType?.kind).toBe('structured');
      expect(request.outputType?.jsonSchema).toEqual(CITY_FACTS_JSON_SCHEMA);
    }
  });

  it('a schema-violating final draft fails the run with output-validation-failed', async () => {
    // No placeholder, so the verifier passes - but population is a
    // string, so the zod gate must reject with the TYPED failure
    // (never a silent cast).
    const stub = createScriptedProvider(['{"city":"Tokyo","population":"many"}']);
    const agent = createExtractionAgent(stub);
    const result = await agent.run('Extract the city facts.');
    expect(result.status).toBe('failed');
    expect(result.state.error?.code).toBe('output-validation-failed');
  });

  it('maxVerifierRounds bounds a never-satisfied verifier', async () => {
    // Every draft keeps the placeholder: rounds are capped at 2, so the
    // agent makes exactly 1 + 2 provider calls and then stops gating.
    const stub = createScriptedProvider([
      '{"city":"Tokyo","population":"UNKNOWN"}',
      '{"city":"Tokyo","population":"UNKNOWN"}',
      '{"city":"Tokyo","population":"UNKNOWN"}',
    ]);
    const agent = createExtractionAgent(stub);
    const result = await agent.run('Extract the city facts.');
    expect(stub.scriptsConsumed()).toBe(3);
    // The final draft still fails the zod gate (population is a string),
    // proving the verifier cap hands off to the parse gate rather than
    // looping forever.
    expect(result.status).toBe('failed');
    expect(result.state.error?.code).toBe('output-validation-failed');
  });

  it('the verifier itself is deterministic and side-effect free', () => {
    expect(
      noPlaceholders.verify({ output: 'all good', state: {} as never, stepNumber: 0 }),
    ).toEqual({ ok: true });
    const bounced = noPlaceholders.verify({
      output: 'UNKNOWN',
      state: {} as never,
      stepNumber: 0,
    });
    expect(bounced).toMatchObject({ ok: false });
  });
});
