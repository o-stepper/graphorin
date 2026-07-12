/**
 * Adapter conformance suite: the executable contract between the
 * gateway and third-party adapters. An adapter that passes this
 * suite plugs into `createChannelGateway` without surprises; run it
 * in the adapter repository's own test suite via
 * `describeChannelAdapterConformance(vitestApi, () => makeAdapter())`.
 *
 * The suite covers lifecycle (start/stop idempotence, signal
 * observation), inbound normalization (identity triple, message id,
 * timestamps), delivery receipts and typed delivery errors, and
 * capability-flag sanity. It deliberately does NOT test vendor
 * transports - drive those with the vendor's own fakes.
 *
 * @packageDocumentation
 */

import {
  type ChannelAdapter,
  type InboundAcceptance,
  type InboundChannelMessage,
  isChannelDeliveryError,
} from '../spi.js';

/**
 * The subset of the vitest/jest API the conformance suite needs -
 * injected so this module has no test-framework dependency.
 *
 * @stable
 */
export interface ConformanceTestApi {
  describe(name: string, body: () => void): void;
  it(name: string, body: () => Promise<void> | void): void;
  expect(value: unknown): {
    toBe(expected: unknown): void;
    toBeDefined(): void;
    toBeGreaterThan(expected: number): void;
    toEqual(expected: unknown): void;
    toBeTruthy(): void;
  };
}

/**
 * Hooks the suite uses to drive the adapter under test. `sendInbound`
 * must make the adapter produce ONE inbound message (for a real
 * vendor adapter: through the vendor fake; the loopback adapter's
 * `inject` satisfies it directly).
 *
 * @stable
 */
export interface ConformanceHarness {
  /** Fresh adapter instance per test. */
  makeAdapter(): ChannelAdapter;
  /**
   * Cause `adapter` (already started) to emit one inbound message
   * with the given text; resolves with the acceptance the adapter
   * observed.
   */
  sendInbound(adapter: ChannelAdapter, text: string): Promise<InboundAcceptance>;
  /**
   * Optional: make the NEXT `deliver` on `adapter` fail, so the
   * typed-error contract can be exercised. Omit if the adapter
   * cannot simulate failures; the corresponding test is skipped.
   */
  failNextDeliver?(adapter: ChannelAdapter): void;
}

/**
 * Register the conformance suite against a harness.
 *
 * @stable
 */
export function describeChannelAdapterConformance(
  api: ConformanceTestApi,
  harness: ConformanceHarness,
): void {
  const { describe, it, expect } = api;

  describe('ChannelAdapter conformance', () => {
    it('advertises a stable id and complete capabilities', () => {
      const adapter = harness.makeAdapter();
      expect(adapter.id.length).toBeGreaterThan(0);
      expect(typeof adapter.capabilities.edit).toBe('boolean');
      expect(typeof adapter.capabilities.typing).toBe('boolean');
      expect(typeof adapter.capabilities.voice).toBe('boolean');
      expect(adapter.capabilities.maxTextLength).toBeGreaterThan(0);
    });

    it('start() begins receiving; inbound is normalized with the identity triple', async () => {
      const adapter = harness.makeAdapter();
      const received: InboundChannelMessage[] = [];
      const controller = new AbortController();
      await adapter.start({
        signal: controller.signal,
        onInbound: async (message) => {
          received.push(message);
          return { accepted: true };
        },
      });
      const acceptance = await harness.sendInbound(adapter, 'conformance ping');
      expect(acceptance.accepted).toBe(true);
      expect(received.length).toBe(1);
      const message = received[0] as InboundChannelMessage;
      expect(message.identity.channelId).toBe(adapter.id);
      expect(message.identity.accountId.length).toBeGreaterThan(0);
      expect(message.identity.peerId.length).toBeGreaterThan(0);
      expect(message.messageId.length).toBeGreaterThan(0);
      expect(message.text).toBe('conformance ping');
      expect(Number.isNaN(Date.parse(message.receivedAt))).toBe(false);
      await adapter.stop();
    });

    it('propagates the gateway acceptance verdict back to the transport', async () => {
      const adapter = harness.makeAdapter();
      const controller = new AbortController();
      await adapter.start({
        signal: controller.signal,
        onInbound: async () => ({ accepted: false, reason: 'queue-full' }),
      });
      const acceptance = await harness.sendInbound(adapter, 'shed me');
      expect(acceptance).toEqual({ accepted: false, reason: 'queue-full' });
      await adapter.stop();
    });

    it('stop() is idempotent and ceases inbound', async () => {
      const adapter = harness.makeAdapter();
      const controller = new AbortController();
      let count = 0;
      await adapter.start({
        signal: controller.signal,
        onInbound: async () => {
          count += 1;
          return { accepted: true };
        },
      });
      await adapter.stop();
      await adapter.stop();
      const late = await harness.sendInbound(adapter, 'late');
      expect(late.accepted).toBe(false);
      expect(count).toBe(0);
    });

    it('deliver() returns a receipt with a parseable timestamp', async () => {
      const adapter = harness.makeAdapter();
      const controller = new AbortController();
      await adapter.start({
        signal: controller.signal,
        onInbound: async () => ({ accepted: true }),
      });
      const receipt = await adapter.deliver({
        identity: { channelId: adapter.id, accountId: 'bot', peerId: 'peer-1' },
        text: 'hello from the conformance suite',
      });
      expect(Number.isNaN(Date.parse(receipt.deliveredAt))).toBe(false);
      await adapter.stop();
    });

    if (harness.failNextDeliver !== undefined) {
      it('a failed deliver throws the typed ChannelDeliveryError', async () => {
        const adapter = harness.makeAdapter();
        const controller = new AbortController();
        await adapter.start({
          signal: controller.signal,
          onInbound: async () => ({ accepted: true }),
        });
        harness.failNextDeliver?.(adapter);
        let caught: unknown;
        try {
          await adapter.deliver({
            identity: { channelId: adapter.id, accountId: 'bot', peerId: 'peer-1' },
            text: 'doomed',
          });
        } catch (err) {
          caught = err;
        }
        expect(caught).toBeDefined();
        expect(isChannelDeliveryError(caught)).toBe(true);
        await adapter.stop();
      });
    }
  });
}
