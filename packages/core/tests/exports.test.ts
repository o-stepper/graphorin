import testPkg from '../package.json' with { type: 'json' };

const pkgVersion: string = testPkg.version;

import { describe, expect, it } from 'vitest';

import * as core from '../src/index.js';

describe('@graphorin/core', () => {
  it('re-exports the canonical version constant', () => {
    expect(core.VERSION).toBe(pkgVersion);
  });

  it('re-exports core utilities', () => {
    expect(typeof core.collect).toBe('function');
    expect(typeof core.mapStream).toBe('function');
    expect(typeof core.merge).toBe('function');
    expect(typeof core.withSignal).toBe('function');
    expect(typeof core.filter).toBe('function');
    expect(typeof core.take).toBe('function');
    expect(typeof core.takeWhile).toBe('function');
    expect(typeof core.assertNever).toBe('function');
    expect(typeof core.md5).toBe('function');
    expect(typeof core.xxhash).toBe('function');
    expect(typeof core.createAsyncContext).toBe('function');
  });

  it('re-exports stop-condition combinators', () => {
    expect(typeof core.isStepCount).toBe('function');
    expect(typeof core.hasToolCall).toBe('function');
    expect(typeof core.or).toBe('function');
    expect(typeof core.and).toBe('function');
    expect(typeof core.not).toBe('function');
    expect(core.isTerminal.description).toBe('status:terminal');
  });

  it('re-exports channel constructors with graphorin-only names', () => {
    expect(typeof core.latestValue).toBe('function');
    expect(typeof core.anyValue).toBe('function');
    expect(typeof core.reducer).toBe('function');
    expect(typeof core.stream).toBe('function');
    expect(typeof core.barrier).toBe('function');
    expect(typeof core.ephemeral).toBe('function');
    expect(typeof core.listAggregate).toBe('function');
  });

  it('re-exports workflow control-flow primitives', () => {
    expect(typeof core.Directive).toBe('function');
    expect(typeof core.Dispatch).toBe('function');
    expect(typeof core.dispatch).toBe('function');
    expect(typeof core.pause).toBe('function');
    expect(typeof core.isPauseSignal).toBe('function');
    expect(typeof core.runWithPauseResume).toBe('function');
  });

  it('re-exports the no-op tracer', () => {
    expect(typeof core.NOOP_TRACER.startSpan).toBe('function');
    expect(typeof core.NOOP_TRACER.span).toBe('function');
    expect(typeof core.NOOP_TRACER.shutdown).toBe('function');
  });

  it('re-exports the no-op logger', () => {
    expect(typeof core.NOOP_LOGGER.info).toBe('function');
    expect(typeof core.NOOP_LOGGER.child).toBe('function');
  });

  it('re-exports SecretValue brand symbols', () => {
    expect(typeof core.SECRET_VALUE_BRAND).toBe('symbol');
    expect(typeof core.NODEJS_INSPECT_CUSTOM).toBe('symbol');
    expect(core.SECRET_VALUE_BRAND).toBe(Symbol.for('graphorin.SecretValue'));
    expect(core.NODEJS_INSPECT_CUSTOM).toBe(Symbol.for('nodejs.util.inspect.custom'));
  });

  it('exposes the cost-tier vocabulary triple', () => {
    expect(core.MODEL_HINTS).toEqual(['fast', 'balanced', 'smart']);
    expect(Object.isFrozen(core.MODEL_HINTS) || Array.isArray(core.MODEL_HINTS)).toBe(true);
  });
});
