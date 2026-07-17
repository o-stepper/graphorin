/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Structured-output + response-verifier acceptance demo - library mode.
 * One extraction agent declares the full structured contract:
 *
 *   - `outputType.jsonSchema` - the CLOSED wire schema advertised to the
 *     model (adapters with native structured output map it to a strict
 *     `response_format: json_schema`; the stub records the request so the
 *     tests can assert the forwarding);
 *   - `outputType.schema` - the local zod parse gate: the terminal text
 *     must parse into `CityFacts` or the run fails with the typed
 *     `output-validation-failed` error, never a silent cast;
 *   - `verifiers` - a deterministic C3 {@link ResponseVerifier} that
 *     bounces a placeholder draft back to the model as
 *     `[verifier:no-placeholders]` feedback for one continuation round.
 *
 * The stub provider scripts a flawed first draft (an `UNKNOWN`
 * placeholder) followed by the corrected one, so a single `runExtraction()`
 * demonstrates the whole loop: draft -> verifier feedback -> corrected
 * draft -> zod-typed output.
 */

import process from 'node:process';
import type { ResponseVerifier } from '@graphorin/agent';
import { createAgent } from '@graphorin/agent';
import { isMainModule, optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import { z } from 'zod';
import pkg from '../package.json' with { type: 'json' };
import { createScriptedProvider, type StubProviderHandle } from './stub-provider.js';

/** Canonical version constant, derived from `package.json` at build time. */
export const VERSION: string = pkg.version;

/** The typed extraction target - `schema.parse` gates the final output. */
export const CityFacts = z.object({
  city: z.string().min(1),
  population: z.number().int().positive(),
});
export type CityFacts = z.infer<typeof CityFacts>;

/**
 * The CLOSED wire schema advertised to the model. Closed matters in the
 * real world: the Anthropic OpenAI-compat endpoint accepts only
 * `strict: true` json_schema with `additionalProperties: false`
 * (live-verified 2026-07-17 - see the providers guide).
 */
export const CITY_FACTS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    city: { type: 'string' },
    population: { type: 'number' },
  },
  required: ['city', 'population'],
  additionalProperties: false,
} as const;

/**
 * Deterministic verifier: a terminal draft that still contains the
 * `UNKNOWN` placeholder is bounced back to the model with actionable
 * feedback. `ok: false` costs one C3 continuation round (bounded by
 * `maxVerifierRounds`); the feedback lands in the transcript as a user
 * message prefixed `[verifier:no-placeholders]`.
 */
export const noPlaceholders: ResponseVerifier = {
  id: 'no-placeholders',
  verify({ output }) {
    if (output.includes('UNKNOWN')) {
      return {
        ok: false,
        feedback:
          'The draft still contains the UNKNOWN placeholder. Replace it with the numeric population from the source text and resend the full JSON object.',
      };
    }
    return { ok: true };
  },
};

export interface ExtractionRun {
  readonly facts: CityFacts;
  /** `[verifier:...]` feedback messages the run fed back to the model. */
  readonly verifierFeedback: ReadonlyArray<string>;
  /** Provider calls consumed - 2 when the verifier bounced a draft. */
  readonly providerCalls: number;
  readonly stub: StubProviderHandle;
}

/** Build the extraction agent over an injectable scripted provider. */
export function createExtractionAgent(stub: StubProviderHandle) {
  return createAgent<unknown, CityFacts>({
    name: 'city-facts-extractor',
    instructions:
      'Extract the city name and its population from the user text. Respond with JSON only.',
    provider: stub.provider,
    ...(() => {
      const tracer = optionalTracerFromEnv(process.env);
      return tracer !== undefined ? { tracer } : {};
    })(),
    outputType: {
      kind: 'structured',
      description: 'The city facts extracted from the source text.',
      jsonSchema: CITY_FACTS_JSON_SCHEMA,
      schema: CityFacts,
    },
    verifiers: [noPlaceholders],
    maxVerifierRounds: 2,
  });
}

/**
 * Run the full loop against the canonical two-draft script: the first
 * draft carries the `UNKNOWN` placeholder (verifier bounces it), the
 * second is the corrected JSON the zod gate types.
 */
export async function runExtraction(): Promise<ExtractionRun> {
  const stub = createScriptedProvider([
    '{"city":"Tokyo","population":"UNKNOWN"}',
    '{"city":"Tokyo","population":37400000}',
  ]);
  const agent = createExtractionAgent(stub);
  const result = await agent.run(
    'The Tokyo metro area has about 37400000 residents. Extract the city facts.',
  );
  if (result.status !== 'completed') {
    throw new Error(`extraction run ended '${result.status}': ${result.state.error?.message}`);
  }
  // The runtime commits the bounce as one user message ("Your response
  // failed N verification check(s) ...") carrying every
  // `[verifier:<id>] <feedback>` line - match on the marker.
  const verifierFeedback = result.state.messages
    .filter((m) => m.role === 'user' && typeof m.content === 'string')
    .map((m) => m.content as string)
    .filter((c) => c.includes('[verifier:'));
  return {
    facts: result.output,
    verifierFeedback,
    providerCalls: stub.scriptsConsumed(),
    stub,
  };
}

async function main(): Promise<void> {
  const run = await runExtraction();
  process.stdout.write(
    `graphorin v${VERSION} structured-verifier - city='${run.facts.city}', population=${run.facts.population}, ` +
      `providerCalls=${run.providerCalls}, verifierRounds=${run.verifierFeedback.length}: OK\n`,
  );
}

if (isMainModule(import.meta.url, process.argv[1])) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
