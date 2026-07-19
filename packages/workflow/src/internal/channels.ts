/**
 * Per-channel atomic write merger. The execution-step semantics
 * documented in `04-workflow-engine.md` § Execution-step semantics
 * require deterministic per-channel apply behaviour even under
 * parallel writes - this module owns that guarantee.
 *
 * @packageDocumentation
 */

import type { Channel } from '@graphorin/core';

import { InvalidChannelWriteError, MultiWriteError, ReducerError } from '../errors/index.js';
import { TASKS_CHANNEL } from '../types.js';

/**
 * @internal - single channel write produced by a node task.
 */
export interface ChannelWrite {
  readonly nodeName: string;
  readonly taskId: string;
  readonly index: number;
  readonly channel: string;
  readonly value: unknown;
}

/**
 * @internal - combined apply result. The runtime feeds the new state
 * back to the next planning round and ships the bumped versions into
 * the persisted checkpoint so reconstructed runs see the same view.
 */
export interface ApplyResult<TState extends object> {
  readonly state: TState;
  readonly versions: Readonly<Record<string, number>>;
  readonly changedChannels: ReadonlyArray<string>;
  /**
   * Merged values of the `ephemeral` channels touched this step.
   * Ephemeral values are wiped from `state` before this
   * function returns, so the engine surfaces them on the
   * `workflow.channel.update` event instead - the only place a consumer
   * can ever observe them.
   */
  readonly ephemeralValues: Readonly<Record<string, unknown>>;
}

/**
 * Apply every write produced during a single execution step. Values
 * are merged per the channel kind documented in
 * `04-workflow-engine.md` § Channels.
 *
 * @internal
 */
export function applyWrites<TState extends object>(input: {
  readonly state: TState;
  readonly versions: Readonly<Record<string, number>>;
  readonly channels: Readonly<Record<string, Channel<unknown>>>;
  readonly writes: ReadonlyArray<ChannelWrite>;
}): ApplyResult<TState> {
  const next: Record<string, unknown> = { ...(input.state as Record<string, unknown>) };
  const versions: Record<string, number> = { ...input.versions };
  const ephemeralKeys = new Set<string>();
  const changed = new Set<string>();
  const writesByChannel = groupByChannel(input.writes);

  for (const [channelName, writes] of writesByChannel) {
    const descriptor =
      channelName === TASKS_CHANNEL ? streamDescriptor() : input.channels[channelName];
    if (!descriptor) {
      const offender = writes[0]?.nodeName ?? '<unknown>';
      throw new InvalidChannelWriteError(offender, channelName);
    }
    const before = next[channelName];
    const merged = mergeChannel(channelName, descriptor, before, writes);
    next[channelName] = merged;
    versions[channelName] = (versions[channelName] ?? 0) + 1;
    changed.add(channelName);
    if (descriptor.kind === 'ephemeral') ephemeralKeys.add(channelName);
  }

  const ephemeralValues: Record<string, unknown> = {};
  for (const key of ephemeralKeys) {
    ephemeralValues[key] = next[key];
    delete next[key];
  }

  return {
    state: next as TState,
    versions: Object.freeze({ ...versions }),
    changedChannels: Object.freeze([...changed]),
    ephemeralValues: Object.freeze(ephemeralValues),
  };
}

/**
 * Produce the initial state shape from declared channel defaults
 * merged with `initialState` and the per-execute input. Honours each
 * channel's `default` field so consumers do not have to repeat the
 * value at every entry point.
 *
 * @internal
 */
export function buildInitialState<TState extends object>(input: {
  readonly channels: Readonly<Record<string, Channel<unknown>>>;
  readonly initial?: Partial<TState>;
  readonly inputState: Partial<TState>;
}): TState {
  const state: Record<string, unknown> = {};
  for (const [name, descriptor] of Object.entries(input.channels)) {
    if ('default' in descriptor && descriptor.default !== undefined) {
      state[name] = descriptor.default;
    }
  }
  for (const [k, v] of Object.entries(input.initial ?? {})) {
    if (v !== undefined) state[k] = v;
  }
  for (const [k, v] of Object.entries(input.inputState)) {
    if (v !== undefined) state[k] = v;
  }
  return state as TState;
}

function groupByChannel(writes: ReadonlyArray<ChannelWrite>): Map<string, ChannelWrite[]> {
  const out = new Map<string, ChannelWrite[]>();
  for (const w of writes) {
    const list = out.get(w.channel) ?? [];
    list.push(w);
    out.set(w.channel, list);
  }
  return out;
}

function mergeChannel(
  channelName: string,
  descriptor: Channel<unknown>,
  before: unknown,
  writes: ReadonlyArray<ChannelWrite>,
): unknown {
  switch (descriptor.kind) {
    case 'latest-value': {
      if (writes.length > 1) {
        const writers = writes.map((w) => w.nodeName);
        throw new MultiWriteError(channelName, writers);
      }
      return writes[0]?.value;
    }
    case 'any-value': {
      return writes[writes.length - 1]?.value;
    }
    case 'reducer': {
      const reduce = descriptor.reduce as (prev: unknown, next: unknown) => unknown;
      let acc: unknown = before;
      try {
        for (const w of writes) {
          acc = reduce(acc, w.value);
        }
      } catch (err) {
        throw new ReducerError(channelName, err);
      }
      return acc;
    }
    case 'list-aggregate': {
      const acc: unknown[] = Array.isArray(before) ? [...(before as unknown[])] : [];
      for (const w of writes) {
        if (Array.isArray(w.value)) {
          for (const item of w.value as unknown[]) acc.push(item);
        } else {
          acc.push(w.value);
        }
      }
      return acc;
    }
    case 'stream': {
      const acc: unknown[] = Array.isArray(before) ? [...(before as unknown[])] : [];
      for (const w of writes) {
        if (Array.isArray(w.value)) {
          for (const item of w.value as unknown[]) {
            if (descriptor.unique && acc.some((existing) => deepEqual(existing, item))) continue;
            acc.push(item);
          }
        } else {
          if (descriptor.unique && acc.some((existing) => deepEqual(existing, w.value))) continue;
          acc.push(w.value);
        }
      }
      return acc;
    }
    case 'barrier': {
      const required = new Set(descriptor.from);
      const map: Record<string, unknown> = isPlainObject(before) ? { ...before } : {};
      for (const w of writes) {
        if (!required.has(w.nodeName)) continue;
        map[w.nodeName] = w.value;
      }
      return map;
    }
    case 'ephemeral': {
      return writes[writes.length - 1]?.value;
    }
    default: {
      const exhaustive: never = descriptor;
      throw new Error(`graphorin: unhandled channel kind ${String(exhaustive)}`);
    }
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((item, idx) => deepEqual(item, b[idx]));
  }
  const aEntries = Object.entries(a as Record<string, unknown>);
  const bRecord = b as Record<string, unknown>;
  if (aEntries.length !== Object.keys(bRecord).length) return false;
  return aEntries.every(([key, value]) => deepEqual(value, bRecord[key]));
}

function streamDescriptor(): Channel<unknown> {
  return { kind: 'stream' } as const;
}
