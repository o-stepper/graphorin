/**
 * The loopback adapter passes its own conformance suite - this is
 * both the suite's self-test and the executable reference for
 * third-party adapter authors.
 */
import { describe, expect, it } from 'vitest';
import type { ChannelAdapter } from '../src/index.js';
import {
  createLoopbackAdapter,
  describeChannelAdapterConformance,
  type LoopbackAdapter,
} from '../src/testkit/index.js';

describeChannelAdapterConformance(
  { describe, it, expect },
  {
    makeAdapter: () => createLoopbackAdapter(),
    sendInbound: (adapter: ChannelAdapter, text: string) =>
      (adapter as LoopbackAdapter).inject({ text }),
    failNextDeliver: (adapter: ChannelAdapter) => {
      (adapter as LoopbackAdapter).failNextDeliver();
    },
  },
);
