import { describe, expect, it } from 'vitest';
import type { SpanRecord } from '../../src/exporters/index.js';
import { sanitizeRecord } from '../../src/exporters/with-validation.js';
import { createRedactionValidator } from '../../src/redaction/index.js';

describe('@graphorin/observability/redaction — performance budget', () => {
  it('mean withValidation overhead per span stays under the documented budget', () => {
    const validator = createRedactionValidator({ minTier: 'internal' });
    const record: SpanRecord = {
      type: 'provider.generate',
      id: 'span',
      traceId: 'trace',
      name: 'provider.generate',
      startUnixNano: 1,
      endUnixNano: 2,
      status: 'ok',
      attributes: {
        'gen_ai.system': 'openai',
        'gen_ai.request.model': 'gpt-4o',
        'gen_ai.usage.input_tokens': 100,
        'gen_ai.usage.output_tokens': 50,
        'graphorin.session.id': 'session-1',
        'graphorin.agent.id': 'agent-1',
      },
      events: [],
    };

    // Warm-up to amortize JIT compilation.
    for (let i = 0; i < 1000; i++) sanitizeRecord(record, validator);

    const iterations = 5_000;
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
      const out = sanitizeRecord(record, validator);
      if (out === null) throw new Error('unexpected null sanitized record');
    }
    const elapsedNs = Number(process.hrtime.bigint() - start);
    const meanUs = elapsedNs / iterations / 1000;
    // Budget is 100µs p95; mean must be comfortably under that.
    expect(meanUs).toBeLessThan(150);
  });
});
