import { describe, expect, it, vi } from 'vitest';

import { NOOP_LOGGER } from '../src/contracts/logger.js';
import { NOOP_TRACER } from '../src/contracts/tracer.js';

describe('NOOP_TRACER', () => {
  it('returns a typed span object that swallows every method call', () => {
    const span = NOOP_TRACER.startSpan({ type: 'agent.run' });
    expect(span.type).toBe('agent.run');
    expect(() => {
      span.setAttributes({ a: 1 });
      span.addEvent('e');
      span.recordException(new Error('x'));
      span.setStatus('ok');
      span.end();
    }).not.toThrow();
  });

  it('runs the function inside .span() and ends the span', async () => {
    const fn = vi.fn(() => 42);
    const r = await NOOP_TRACER.span({ type: 'agent.run' }, fn);
    expect(r).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('shutdown is a resolved Promise', async () => {
    await expect(NOOP_TRACER.shutdown()).resolves.toBeUndefined();
  });
});

describe('NOOP_LOGGER', () => {
  it('exposes every level as a no-op', () => {
    expect(() => {
      NOOP_LOGGER.trace('m');
      NOOP_LOGGER.debug('m');
      NOOP_LOGGER.info('m');
      NOOP_LOGGER.warn('m');
      NOOP_LOGGER.error('m');
    }).not.toThrow();
  });

  it('child() returns the same no-op logger', () => {
    expect(NOOP_LOGGER.child({ runId: 'r' })).toBe(NOOP_LOGGER);
  });
});
