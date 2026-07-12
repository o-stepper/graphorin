import {
  type ChannelAdapter,
  type ChannelCapabilities,
  ChannelDeliveryError,
  type ChannelRuntimeContext,
  type DeliveryPayload,
  type DeliveryReceipt,
  type InboundAcceptance,
  type InboundChannelMessage,
} from '../spi.js';

/** Options for {@link createLoopbackAdapter}. @stable */
export interface LoopbackAdapterOptions {
  /** Channel id. Default `'loopback'`. */
  readonly id?: string;
  readonly capabilities?: Partial<ChannelCapabilities>;
  /** Account id stamped on injected messages. Default `'bot'`. */
  readonly accountId?: string;
}

/** Convenience shape for {@link LoopbackAdapter.inject}. @stable */
export interface LoopbackInboundInput {
  readonly text: string;
  /** Default `'peer-1'`. */
  readonly peerId?: string;
  readonly messageId?: string;
  readonly replyTo?: InboundChannelMessage['replyTo'];
  readonly attachments?: InboundChannelMessage['attachments'];
}

/**
 * The in-memory loopback adapter: a full `ChannelAdapter` whose
 * transport is the test itself. Tests `inject()` inbound messages
 * and read `deliveries` for what the gateway sent back.
 *
 * @stable
 */
export interface LoopbackAdapter extends ChannelAdapter {
  /** Push one inbound message through the gateway (must be started). */
  inject(input: LoopbackInboundInput): Promise<InboundAcceptance>;
  /** Every payload delivered so far, in order (post-sanitization). */
  readonly deliveries: ReadonlyArray<DeliveryPayload>;
  readonly started: boolean;
  /** Make the next `deliver` call throw a retryable ChannelDeliveryError. */
  failNextDeliver(): void;
}

/**
 * Build a loopback adapter for tests and prototypes.
 *
 * @stable
 */
export function createLoopbackAdapter(options: LoopbackAdapterOptions = {}): LoopbackAdapter {
  const id = options.id ?? 'loopback';
  const accountId = options.accountId ?? 'bot';
  const capabilities: ChannelCapabilities = {
    edit: false,
    typing: false,
    voice: false,
    maxTextLength: 4096,
    ...options.capabilities,
  };
  const deliveries: DeliveryPayload[] = [];
  let ctx: ChannelRuntimeContext | undefined;
  let seq = 0;
  let outSeq = 0;
  let failNext = false;

  return {
    id,
    capabilities,
    get deliveries() {
      return deliveries;
    },
    get started() {
      return ctx !== undefined;
    },
    failNextDeliver() {
      failNext = true;
    },
    async start(runtime: ChannelRuntimeContext): Promise<void> {
      ctx = runtime;
      runtime.signal.addEventListener('abort', () => {
        ctx = undefined;
      });
    },
    async stop(): Promise<void> {
      ctx = undefined;
    },
    async inject(input: LoopbackInboundInput): Promise<InboundAcceptance> {
      if (ctx === undefined) return { accepted: false, reason: 'stopped' };
      seq += 1;
      return ctx.onInbound({
        identity: { channelId: id, accountId, peerId: input.peerId ?? 'peer-1' },
        messageId: input.messageId ?? `in-${seq}`,
        text: input.text,
        receivedAt: new Date().toISOString(),
        ...(input.replyTo !== undefined ? { replyTo: input.replyTo } : {}),
        ...(input.attachments !== undefined ? { attachments: input.attachments } : {}),
      });
    },
    async deliver(payload: DeliveryPayload): Promise<DeliveryReceipt> {
      if (failNext) {
        failNext = false;
        throw new ChannelDeliveryError(id, 'loopback: simulated delivery failure', true);
      }
      deliveries.push(payload);
      outSeq += 1;
      return { messageId: `out-${outSeq}`, deliveredAt: new Date().toISOString() };
    },
  };
}
