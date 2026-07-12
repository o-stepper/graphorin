import { describe, expect, it } from 'vitest';
import {
  type ChannelAdapter,
  ChannelDeliveryError,
  type InboundChannelMessage,
  isChannelDeliveryError,
} from '../src/index.js';

describe('ChannelDeliveryError', () => {
  it('carries the channel id, retryability and the [graphorin/channels] prefix', () => {
    const err = new ChannelDeliveryError('telegram', 'rate limited', true);
    expect(err.name).toBe('ChannelDeliveryError');
    expect(err.channelId).toBe('telegram');
    expect(err.retryable).toBe(true);
    expect(err.message).toContain('[graphorin/channels]');
    expect(err.message).toContain('telegram');
  });

  it('defaults retryable to false and threads cause', () => {
    const cause = new Error('socket closed');
    const err = new ChannelDeliveryError('slack', 'transport error', undefined, { cause });
    expect(err.retryable).toBe(false);
    expect(err.cause).toBe(cause);
  });

  it('isChannelDeliveryError matches by name across realm boundaries', () => {
    const foreign = Object.assign(new Error('x'), { name: 'ChannelDeliveryError' });
    expect(isChannelDeliveryError(new ChannelDeliveryError('t', 'x'))).toBe(true);
    expect(isChannelDeliveryError(foreign)).toBe(true);
    expect(isChannelDeliveryError(new Error('x'))).toBe(false);
    expect(isChannelDeliveryError('nope')).toBe(false);
  });
});

describe('SPI shape (compile-time contract exercised at runtime)', () => {
  it('a minimal adapter satisfies ChannelAdapter', async () => {
    const seen: InboundChannelMessage[] = [];
    const adapter: ChannelAdapter = {
      id: 'loop',
      capabilities: { edit: false, typing: false, voice: false, maxTextLength: 4096 },
      async start(ctx) {
        const acceptance = await ctx.onInbound({
          identity: { channelId: 'loop', accountId: 'bot', peerId: 'user' },
          messageId: 'm1',
          text: 'hi',
          receivedAt: new Date(0).toISOString(),
        });
        expect(acceptance.accepted).toBe(true);
      },
      async stop() {},
      async deliver(payload) {
        expect(payload.identity.channelId).toBe('loop');
        return { deliveredAt: new Date(0).toISOString() };
      },
    };
    const controller = new AbortController();
    await adapter.start({
      onInbound: async (message) => {
        seen.push(message);
        return { accepted: true };
      },
      signal: controller.signal,
    });
    expect(seen).toHaveLength(1);
    await adapter.deliver({
      identity: { channelId: 'loop', accountId: 'bot', peerId: 'user' },
      text: 'reply',
    });
    await adapter.stop();
  });
});
