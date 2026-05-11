import { describe, expect, it } from 'vitest';

import { createLogger, getCurrentSpanContext, withCurrentSpan } from '../../src/logger/index.js';
import {
  createRedactionValidator,
  type RedactionValidatorInstance,
} from '../../src/redaction/index.js';
import { createTracer } from '../../src/tracer/index.js';

describe('@graphorin/observability/logger', () => {
  it('emits structured JSON by default', () => {
    const lines: string[] = [];
    const logger = createLogger({ sink: (_, line) => lines.push(line) });
    logger.info('hello', { userId: 'u1' });
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0] ?? '{}');
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('hello');
    expect(parsed.userId).toBe('u1');
  });

  it('redacts fields through the supplied validator', () => {
    const validator = createRedactionValidator({ minTier: 'internal' });
    const lines: string[] = [];
    const logger = createLogger({
      sink: (_, line) => lines.push(line),
      redaction: validator,
      defaultTier: 'public',
    });
    logger.info('x', { contact: 'alice@example.com' });
    const parsed = JSON.parse(lines[0] ?? '{}');
    expect(parsed.contact).toContain('[REDACTED email]');
  });

  it('correlates with the current span context', async () => {
    const lines: string[] = [];
    const tracer = createTracer({
      exporters: [
        {
          id: 'noop',
          export: async () => undefined,
          flush: async () => undefined,
          shutdown: async () => undefined,
        },
      ],
      warnSink: () => {},
    });
    const logger = createLogger({ sink: (_, line) => lines.push(line) });
    await tracer.span({ type: 'agent.run' }, async (span) => {
      await withCurrentSpan(span, async () => {
        logger.info('inside');
      });
    });
    await tracer.shutdown();
    const parsed = JSON.parse(lines[0] ?? '{}');
    expect(parsed.traceId).toBeDefined();
    expect(parsed.spanId).toBeDefined();
  });

  it('child loggers merge inherited fields', () => {
    const lines: string[] = [];
    const parent = createLogger({ sink: (_, line) => lines.push(line) });
    const child = parent.child({ component: 'x' });
    child.warn('m', { extra: 1 });
    const parsed = JSON.parse(lines[0] ?? '{}');
    expect(parsed.component).toBe('x');
    expect(parsed.extra).toBe(1);
  });

  it('respects the configured min level', () => {
    const lines: string[] = [];
    const logger = createLogger({ level: 'warn', sink: (_, line) => lines.push(line) });
    logger.debug('hidden');
    logger.info('also hidden');
    logger.warn('visible');
    expect(lines).toHaveLength(1);
  });

  it('renders pretty when format is set', () => {
    const lines: string[] = [];
    const logger = createLogger({ format: 'pretty', sink: (_, line) => lines.push(line) });
    logger.info('hello', { extra: 1 });
    expect(lines[0]).toContain('INFO');
    expect(lines[0]).toContain('hello');
  });

  it('getCurrentSpanContext returns undefined outside withCurrentSpan', () => {
    expect(getCurrentSpanContext()).toBeUndefined();
  });

  it('child loggers can themselves spawn grandchildren', () => {
    const lines: string[] = [];
    const logger = createLogger({ sink: (_, line) => lines.push(line) });
    const grand = logger.child({ a: 1 }).child({ b: 2 });
    grand.info('m');
    const parsed = JSON.parse(lines[0] ?? '{}');
    expect(parsed.a).toBe(1);
    expect(parsed.b).toBe(2);
  });

  it('emits at every level via the default console sink', () => {
    const out: string[] = [];
    const original = {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };
    console.debug = (line) => out.push(`d:${line}`);
    console.info = (line) => out.push(`i:${line}`);
    console.warn = (line) => out.push(`w:${line}`);
    console.error = (line) => out.push(`e:${line}`);
    try {
      const logger = createLogger({ level: 'trace' });
      logger.trace('a');
      logger.debug('b');
      logger.info('c');
      logger.warn('d');
      logger.error('e');
    } finally {
      console.debug = original.debug;
      console.info = original.info;
      console.warn = original.warn;
      console.error = original.error;
    }
    expect(out).toHaveLength(5);
  });

  it('skips fields that the validator drops', () => {
    const lines: string[] = [];
    // failOnUnredactedSensitive=false; tier 'secret' > minTier 'public' → drop
    const validator = createLoggerValidator();
    const logger = createLogger({
      sink: (_, line) => lines.push(line),
      redaction: validator,
      defaultTier: 'secret',
    });
    logger.info('m', { confidential: 'top secret' });
    const parsed = JSON.parse(lines[0] ?? '{}');
    expect(parsed.confidential).toBeUndefined();
  });
});

function createLoggerValidator(): RedactionValidatorInstance {
  return createRedactionValidator({ minTier: 'public' });
}
