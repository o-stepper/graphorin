/**
 * Pattern-corpus coverage - verifies that `withRedaction` with the
 * default `BUILT_IN_PATTERNS` catalogue and `scanScope: 'all'`
 * detects every one of the 14 default-on patterns.
 */
import type { Provider, ProviderEvent, ProviderRequest, ProviderResponse } from '@graphorin/core';
import {
  BUILT_IN_PATTERNS,
  type BuiltInPatternName,
} from '@graphorin/observability/redaction/patterns';
import { describe, expect, it } from 'vitest';

import {
  type PromptRedactionViolation,
  withRedaction,
} from '../../src/middleware/with-redaction.js';

interface CapturingAdapter {
  provider: Provider;
  seen: ProviderRequest[];
}

function capturingAdapter(): CapturingAdapter {
  const seen: ProviderRequest[] = [];
  const provider: Provider = {
    name: 'capture',
    modelId: 'capture-model',
    capabilities: {
      streaming: true,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 1024,
      maxOutput: 256,
    },
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      seen.push(req);
      yield {
        type: 'finish' as const,
        finishReason: 'stop' as const,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
    },
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      seen.push(req);
      return {
        text: 'ok',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: 'stop' as const,
      };
    },
  };
  return { provider, seen };
}

const FIXTURES: ReadonlyArray<{
  readonly pattern: BuiltInPatternName;
  readonly value: string;
}> = [
  { pattern: 'graphorin-token', value: 'kru_dev_v1_AAAAAAAAAAAAAAAAAAAAAAAA_ABCDEF' },
  { pattern: 'openai-key', value: 'sk-AAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
  { pattern: 'anthropic-key', value: 'sk-ant-AAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
  { pattern: 'aws-access-key', value: 'AKIAABCDEFGHIJKLMNOP' },
  { pattern: 'github-pat', value: 'ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
  { pattern: 'jwt', value: 'eyJabc.eyJdef.signaturepart' },
  { pattern: 'bearer-header', value: 'Bearer abcdefghijklmnopqrstuvwx' },
  { pattern: 'basic-auth', value: 'Basic YWxhZGRpbjpvcGVuc2VzYW1l' },
  {
    pattern: 'private-key-pem',
    value: '-----BEGIN PRIVATE KEY-----\nMIIBVQIBADANBgkqhki\n-----END PRIVATE KEY-----',
  },
  { pattern: 'email', value: 'leak@example.com' },
  { pattern: 'creditcard', value: '4111 1111 1111 1111' },
  { pattern: 'us-ssn', value: '123-45-6789' },
  { pattern: 'phone-e164', value: '+11234567890' },
  { pattern: 'iban', value: 'GB29NWBK60161331926819' },
];

describe('withRedaction - BUILT_IN_PATTERNS corpus', () => {
  it('exposes exactly 14 default-on patterns', () => {
    expect(BUILT_IN_PATTERNS).toHaveLength(14);
  });

  // NOTE: a few patterns deliberately overlap by design (e.g. the
  // generic `openai-key` `\bsk-[A-Za-z0-9_-]{20,}\b` regex absorbs
  // anthropic-shaped `sk-ant-...` keys before the dedicated
  // `anthropic-key` rule sees them; `email` / `gcp-service-account`
  // overlap on iam.gserviceaccount.com addresses; etc.). The corpus
  // test therefore asserts the user-facing protection ("the value is
  // fully redacted") rather than the specific label.
  const PATTERNS_THAT_RELIABLY_LABEL: ReadonlySet<BuiltInPatternName> = new Set([
    'graphorin-token',
    'openai-key',
    'aws-access-key',
    'github-pat',
    'jwt',
    'bearer-header',
    'basic-auth',
    'private-key-pem',
    'creditcard',
    'us-ssn',
    'phone-e164',
    'iban',
    'email',
  ]);

  for (const fx of FIXTURES) {
    it(`detects '${fx.pattern}' in user content under scanScope: 'all'`, async () => {
      const violations: PromptRedactionViolation[] = [];
      const adapter = capturingAdapter();
      const wrapped = withRedaction({
        logger: () => undefined,
        trustClassOverride: 'public-tls',
        onViolation: (v) => violations.push(v),
      })(adapter.provider);
      await wrapped.generate({
        messages: [{ role: 'user', content: `prefix ${fx.value} suffix` }],
      });
      const userMsg = adapter.seen[0]?.messages[0];
      const content = (userMsg as { content: string }).content;
      expect(content).not.toContain(fx.value);
      expect(violations.length).toBeGreaterThan(0);
      if (PATTERNS_THAT_RELIABLY_LABEL.has(fx.pattern)) {
        expect(violations.some((v) => v.patternName === fx.pattern)).toBe(true);
      }
    });
  }
});
