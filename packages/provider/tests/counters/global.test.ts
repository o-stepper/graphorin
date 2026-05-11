/**
 * Coverage for the process-global TokenCounter slot.
 */
import type { Message, TokenCounter } from '@graphorin/core';
import { afterEach, describe, expect, it } from 'vitest';

import {
  __resetGlobalTokenCounter,
  getGlobalTokenCounter,
  setGlobalTokenCounter,
} from '../../src/counters/global.js';

class FixtureCounter implements TokenCounter {
  readonly id = 'fixture';
  readonly version = 'fixture-v1';
  async count(_messages: ReadonlyArray<Message>): Promise<number> {
    return 7;
  }
  async countText(_text: string): Promise<number> {
    return 1;
  }
}

describe('global token counter slot', () => {
  afterEach(() => {
    __resetGlobalTokenCounter();
  });

  it('starts unset', () => {
    expect(getGlobalTokenCounter()).toBeNull();
  });

  it('round-trips an explicitly-set counter', () => {
    const counter = new FixtureCounter();
    setGlobalTokenCounter(counter);
    expect(getGlobalTokenCounter()).toBe(counter);
  });

  it('clears via setGlobalTokenCounter(null)', () => {
    setGlobalTokenCounter(new FixtureCounter());
    setGlobalTokenCounter(null);
    expect(getGlobalTokenCounter()).toBeNull();
  });

  it('__resetGlobalTokenCounter clears the slot', () => {
    setGlobalTokenCounter(new FixtureCounter());
    __resetGlobalTokenCounter();
    expect(getGlobalTokenCounter()).toBeNull();
  });
});
