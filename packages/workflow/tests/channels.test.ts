import type { Channel } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import {
  anyValue,
  barrier,
  ephemeral,
  InvalidChannelWriteError,
  latestValue,
  listAggregate,
  MultiWriteError,
  ReducerError,
  reducer,
  stream,
} from '../src/index.js';
import { applyWrites, buildInitialState, type ChannelWrite } from '../src/internal/channels.js';

interface TestState {
  status: string;
  notes: ReadonlyArray<string>;
  total: number;
  flag: boolean;
  events: ReadonlyArray<string>;
  joined: Record<string, string>;
  scratch: string;
}

// The internal applyWrites/buildInitialState signatures take the erased
// `Record<string, Channel<unknown>>` view (the engine casts the same way) —
// per-key channel generics are intentionally dropped at this boundary.
const channels = {
  status: latestValue<string>({ default: 'pending' }),
  notes: listAggregate<string>({ default: [] }),
  total: reducer<number>((prev, next) => (prev ?? 0) + next, { default: 0 }),
  flag: anyValue<boolean>({ default: false }),
  events: stream<string>({ unique: true, default: [] }),
  joined: barrier<Record<string, string>>(['a', 'b']),
  scratch: ephemeral<string>(),
} as unknown as Readonly<Record<string, Channel<unknown>>>;

function write(
  nodeName: string,
  taskId: string,
  index: number,
  channel: keyof TestState,
  value: unknown,
): ChannelWrite {
  return { nodeName, taskId, index, channel, value };
}

describe('buildInitialState', () => {
  it('honors channel defaults + initialState + per-execute input', () => {
    const initial = buildInitialState<TestState>({
      channels,
      initial: { status: 'starting' },
      inputState: { total: 5 },
    });
    expect(initial.status).toBe('starting');
    expect(initial.notes).toEqual([]);
    expect(initial.total).toBe(5);
    expect(initial.flag).toBe(false);
    expect(initial.events).toEqual([]);
  });

  it('omits channel defaults that are undefined', () => {
    const initial = buildInitialState<TestState>({
      channels,
      inputState: {},
    });
    expect(initial.scratch).toBeUndefined();
    expect(initial.joined).toBeUndefined();
  });
});

describe('applyWrites — channel merge strategies', () => {
  it('LatestValue allows a single writer per step', () => {
    const result = applyWrites<TestState>({
      state: { ...buildInitialState<TestState>({ channels, inputState: {} }) },
      versions: {},
      channels,
      writes: [write('a', 't1', 0, 'status', 'validated')],
    });
    expect(result.state.status).toBe('validated');
    expect(result.versions.status).toBe(1);
    expect(result.changedChannels).toContain('status');
  });

  it('LatestValue throws MultiWriteError on collisions', () => {
    expect(() =>
      applyWrites<TestState>({
        state: buildInitialState<TestState>({ channels, inputState: {} }),
        versions: {},
        channels,
        writes: [write('a', 't1', 0, 'status', 'one'), write('b', 't2', 0, 'status', 'two')],
      }),
    ).toThrow(MultiWriteError);
  });

  it('AnyValue silently keeps the last write', () => {
    const result = applyWrites<TestState>({
      state: buildInitialState<TestState>({ channels, inputState: {} }),
      versions: {},
      channels,
      writes: [write('a', 't1', 0, 'flag', true), write('b', 't2', 0, 'flag', false)],
    });
    expect(result.state.flag).toBe(false);
  });

  it('Reducer accumulates via the supplied callback', () => {
    const result = applyWrites<TestState>({
      state: buildInitialState<TestState>({ channels, inputState: {} }),
      versions: {},
      channels,
      writes: [write('a', 't1', 0, 'total', 10), write('b', 't2', 0, 'total', 20)],
    });
    expect(result.state.total).toBe(30);
  });

  it('Reducer surfaces failures as ReducerError', () => {
    const failing = {
      total: reducer<number>(() => {
        throw new Error('boom');
      }),
    };
    expect(() =>
      applyWrites<{ total: number }>({
        state: { total: 0 },
        versions: {},
        channels: failing as unknown as Readonly<Record<string, Channel<unknown>>>,
        writes: [{ nodeName: 'n', taskId: 't', index: 0, channel: 'total', value: 1 }],
      }),
    ).toThrow(ReducerError);
  });

  it('ListAggregate appends in order across writers', () => {
    const result = applyWrites<TestState>({
      state: buildInitialState<TestState>({ channels, inputState: {} }),
      versions: {},
      channels,
      writes: [
        write('a', 't1', 0, 'notes', ['first']),
        write('b', 't2', 0, 'notes', 'second'),
        write('c', 't3', 0, 'notes', ['third', 'fourth']),
      ],
    });
    expect(result.state.notes).toEqual(['first', 'second', 'third', 'fourth']);
  });

  it('Stream honours uniqueness', () => {
    const result = applyWrites<TestState>({
      state: buildInitialState<TestState>({ channels, inputState: {} }),
      versions: {},
      channels,
      writes: [
        write('a', 't1', 0, 'events', 'click'),
        write('b', 't2', 0, 'events', 'click'),
        write('c', 't3', 0, 'events', ['scroll', 'click', 'scroll']),
      ],
    });
    expect(result.state.events).toEqual(['click', 'scroll']);
  });

  it('Barrier collects per-source writes', () => {
    const result = applyWrites<TestState>({
      state: buildInitialState<TestState>({ channels, inputState: {} }),
      versions: {},
      channels,
      writes: [
        write('a', 't1', 0, 'joined', { ready: 1 }),
        write('b', 't2', 0, 'joined', { ready: 2 }),
        write('extraneous', 't3', 0, 'joined', { ready: 99 }),
      ],
    });
    expect(result.state.joined).toEqual({ a: { ready: 1 }, b: { ready: 2 } });
  });

  it('Ephemeral channels disappear after the step', () => {
    const result = applyWrites<TestState>({
      state: buildInitialState<TestState>({ channels, inputState: {} }),
      versions: {},
      channels,
      writes: [write('a', 't1', 0, 'scratch', 'temp')],
    });
    expect(result.state.scratch).toBeUndefined();
    expect(result.versions.scratch).toBe(1);
  });

  it('rejects writes into undeclared channels', () => {
    expect(() =>
      applyWrites<TestState>({
        state: buildInitialState<TestState>({ channels, inputState: {} }),
        versions: {},
        channels,
        writes: [write('a', 't1', 0, 'unknown' as keyof TestState, 'x')],
      }),
    ).toThrow(InvalidChannelWriteError);
  });
});
