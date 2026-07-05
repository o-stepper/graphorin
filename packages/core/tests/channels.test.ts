import { describe, expect, it } from 'vitest';

import {
  anyValue,
  barrier,
  ephemeral,
  latestValue,
  listAggregate,
  reducer,
  stream,
} from '../src/channels/channels.js';
import { Directive } from '../src/channels/directive.js';
import { Dispatch, dispatch } from '../src/channels/dispatch.js';
import { isPauseSignal, PauseSignal, pause, runWithPauseResume } from '../src/channels/pause.js';

describe('channel constructors', () => {
  it('latestValue', () => {
    expect(latestValue<number>()).toEqual({ kind: 'latest-value' });
    expect(latestValue<number>({ default: 5 })).toEqual({
      kind: 'latest-value',
      default: 5,
    });
  });

  it('anyValue', () => {
    expect(anyValue<number>().kind).toBe('any-value');
  });

  it('reducer', () => {
    const r = reducer<number>((a, b) => a + b, { default: 0 });
    expect(r.kind).toBe('reducer');
    expect(r.reduce(1, 2)).toBe(3);
    expect(r.default).toBe(0);
  });

  it('listAggregate', () => {
    expect(listAggregate<number>().kind).toBe('list-aggregate');
  });

  it('stream', () => {
    const s = stream<number>({ unique: true });
    expect(s.kind).toBe('stream');
    expect(s.unique).toBe(true);
  });

  it('barrier', () => {
    const b = barrier<number>(['a', 'b']);
    expect(b.kind).toBe('barrier');
    expect(b.from).toEqual(['a', 'b']);
  });

  it('ephemeral', () => {
    expect(ephemeral<number>().kind).toBe('ephemeral');
  });
});

describe('Directive', () => {
  it('captures only supplied fields', () => {
    const d = new Directive({ goto: 'next' });
    expect(d.goto).toBe('next');
    expect(d.resume).toBeUndefined();
    expect(d.update).toBeUndefined();
  });

  it('accepts goto + update + resume together', () => {
    const d = new Directive({ goto: 'n', update: { x: 1 }, resume: 'ok' });
    expect(d.goto).toBe('n');
    expect(d.update).toEqual({ x: 1 });
    expect(d.resume).toBe('ok');
  });
});

describe('Dispatch', () => {
  it('captures node name + args', () => {
    const d = new Dispatch('process', { id: 1 });
    expect(d.nodeName).toBe('process');
    expect(d.args).toEqual({ id: 1 });
  });

  it('factory equals constructor', () => {
    const fromFactory = dispatch('x', 42);
    const fromCtor = new Dispatch('x', 42);
    expect(fromFactory.nodeName).toBe(fromCtor.nodeName);
    expect(fromFactory.args).toBe(fromCtor.args);
  });
});

describe('pause', () => {
  it('throws a PauseSignal carrying the supplied value', () => {
    try {
      pause({ kind: 'approval' });
      throw new Error('did not throw');
    } catch (err) {
      expect(isPauseSignal(err)).toBe(true);
      expect(err).toBeInstanceOf(PauseSignal);
      expect((err as PauseSignal).value).toEqual({ kind: 'approval' });
    }
  });

  it('isPauseSignal rejects unrelated errors', () => {
    expect(isPauseSignal(new Error('nope'))).toBe(false);
    expect(isPauseSignal({})).toBe(false);
    expect(isPauseSignal(null)).toBe(false);
    expect(isPauseSignal(undefined)).toBe(false);
  });

  it('returns the resume value when invoked inside runWithPauseResume', async () => {
    const result = await runWithPauseResume(['approved'], () => {
      const value = pause<{ kind: 'approval' }, string>({ kind: 'approval' });
      return value;
    });
    expect(result).toBe('approved');
  });

  it('replays successive values in order to successive pause() calls (WF-2)', async () => {
    const result = await runWithPauseResume(['first', 'second'], () => {
      const a = pause<{ kind: 'approval' }, string>({ kind: 'approval' });
      const b = pause<{ kind: 'approval-2' }, string>({ kind: 'approval-2' });
      return [a, b];
    });
    expect(result).toEqual(['first', 'second']);
  });

  it('falls back to throwing when the runWithPauseResume scope has been consumed', async () => {
    let threw: unknown;
    await runWithPauseResume(['first'], () => {
      const value = pause<{ kind: 'approval' }, string>({ kind: 'approval' });
      expect(value).toBe('first');
      try {
        pause({ kind: 'approval-2' });
      } catch (err) {
        threw = err;
      }
    });
    expect(isPauseSignal(threw)).toBe(true);
  });

  it('an EMPTY values array behaves like no scope - every pause() suspends', async () => {
    let threw: unknown;
    await runWithPauseResume([], () => {
      try {
        pause({ kind: 'approval' });
      } catch (err) {
        threw = err;
      }
    });
    expect(isPauseSignal(threw)).toBe(true);
  });
});
