/**
 * The channel gateway runtime: the pipeline between adapters and the
 * application's agent-invoking handler.
 *
 * Per inbound message: bounded per-adapter queue (shed on overflow)
 * -> access policy (pairing / allowlist / open / disabled) -> inbound
 * sanitization + taint seed -> identity routing -> application
 * handler -> reply delivery with outbound scaffolding sanitization.
 *
 * The gateway is transport-agnostic and server-optional: it runs
 * embedded in any process, and `@graphorin/server` adopts it as a
 * managed daemon through structural typing (start / stop / status),
 * never through a package dependency.
 *
 * @packageDocumentation
 */

import type { ChannelAccessController, ChannelAccessDecision } from './access.js';
import { type SanitizationOutcome, sanitizeChannelInbound } from './inbound.js';
import { type OutboundCommentaryPolicy, sanitizeChannelOutbound } from './outbound.js';
import type { IdentityRouter, ResolvedChannelRoute } from './router.js';
import type {
  ChannelAdapter,
  DeliveryPayload,
  DeliveryQuestion,
  DeliveryReceipt,
  InboundChannelMessage,
} from './spi.js';

/** Reply an inbound handler may return for immediate delivery. @stable */
export interface ChannelReply {
  readonly text: string;
  readonly question?: DeliveryQuestion;
}

/** Everything the application handler receives per authorized message. @stable */
export interface ChannelInboundContext {
  /** The normalized inbound message (original, un-sanitized text). */
  readonly message: InboundChannelMessage;
  /** Sanitized text - feed THIS to the agent, never `message.text`. */
  readonly sanitizedText: string;
  /** Full sanitization outcome (audit counters, pattern hits). */
  readonly sanitization: SanitizationOutcome;
  /** Routing outcome: agent + session selector. */
  readonly route: ResolvedChannelRoute;
  /**
   * Ready-made taint seed: pass as `AgentCallOptions.inboundTaint`
   * so the run's data-flow ledger is armed before the first step.
   */
  readonly inboundTaint: { readonly text: string; readonly sourceKind: string };
  /** Deliver an out-of-band message to the same peer (sanitized). */
  readonly deliver: (reply: ChannelReply) => Promise<DeliveryReceipt>;
}

/**
 * The application seam: invoked once per authorized inbound message,
 * typically running an agent for `route.agentId` /
 * `route.sessionKey`. A returned reply is delivered to the peer;
 * return `undefined` to stay silent. Errors are contained (counted +
 * warned), never fatal to the gateway.
 *
 * @stable
 */
export type ChannelInboundHandler = (
  context: ChannelInboundContext,
) => Promise<ChannelReply | undefined>;

/**
 * Callback for denied / unpaired peers. The FRAMEWORK never texts a
 * peer on its own - the challenge/denial wording is application
 * policy; use `io.deliver` to render one.
 *
 * @stable
 */
export type ChannelUnauthorizedHandler = (
  message: InboundChannelMessage,
  decision: Exclude<ChannelAccessDecision, { kind: 'allow' }>,
  io: { readonly deliver: (reply: ChannelReply) => Promise<DeliveryReceipt> },
) => Promise<void>;

/** Per-channel gateway counters (monotonic since start). @stable */
export interface ChannelGatewayChannelStatus {
  readonly id: string;
  readonly queued: number;
  readonly dropped: number;
  readonly processed: number;
  readonly denied: number;
  readonly failed: number;
  readonly delivered: number;
  readonly deliveryFailures: number;
}

/** Gateway status surfaced to health endpoints. @stable */
export interface ChannelGatewayStatus {
  readonly running: boolean;
  readonly channels: ReadonlyArray<ChannelGatewayChannelStatus>;
}

/** Options for {@link createChannelGateway}. @stable */
export interface ChannelGatewayOptions {
  readonly adapters: ReadonlyArray<ChannelAdapter>;
  readonly router: IdentityRouter;
  readonly access: ChannelAccessController;
  readonly onMessage: ChannelInboundHandler;
  readonly onUnauthorized?: ChannelUnauthorizedHandler;
  /** Bounded inbound queue per adapter. Default 64; overflow sheds with a WARN. */
  readonly queueLimit?: number;
  /**
   * Outbound scaffolding policy for every delivery. Default
   * `'strip'` (messenger peers have no envelope-collapsing UI).
   */
  readonly outboundPolicy?: OutboundCommentaryPolicy;
  /** WARN sink. Default `process.stderr`. */
  readonly warn?: (line: string) => void;
}

/**
 * The gateway handle. `setActivityListener` is the A2 bridge seam:
 * the server (or any host) registers a callback fired on every
 * ACCEPTED inbound message, and wires it to
 * `Scheduler.recordActivity()` so idle triggers debounce on channel
 * traffic. Single listener slot.
 *
 * @stable
 */
export interface ChannelGateway {
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): Promise<ChannelGatewayStatus>;
  /** Proactive outbound send (outbound-sanitized like replies). */
  deliver(payload: DeliveryPayload): Promise<DeliveryReceipt>;
  setActivityListener(listener: (() => void) | undefined): void;
}

/** Configuration error thrown eagerly by {@link createChannelGateway}. @stable */
export class ChannelGatewayConfigError extends Error {
  override readonly name = 'ChannelGatewayConfigError';
  constructor(message: string) {
    super(`[graphorin/channels] invalid gateway configuration: ${message}`);
  }
}

const DEFAULT_QUEUE_LIMIT = 64;

interface ChannelRuntime {
  readonly adapter: ChannelAdapter;
  readonly queue: InboundChannelMessage[];
  draining: boolean;
  queuedTotal: number;
  dropped: number;
  processed: number;
  denied: number;
  failed: number;
  delivered: number;
  deliveryFailures: number;
}

/**
 * Build the gateway. Throws {@link ChannelGatewayConfigError} on an
 * empty adapter list or duplicate adapter ids - fail-closed at
 * construction.
 *
 * @stable
 */
export function createChannelGateway(options: ChannelGatewayOptions): ChannelGateway {
  if (options.adapters.length === 0) {
    throw new ChannelGatewayConfigError('no adapters supplied');
  }
  const ids = new Set<string>();
  for (const adapter of options.adapters) {
    if (adapter.id.length === 0) throw new ChannelGatewayConfigError('an adapter has an empty id');
    if (ids.has(adapter.id)) {
      throw new ChannelGatewayConfigError(`duplicate adapter id '${adapter.id}'`);
    }
    ids.add(adapter.id);
  }

  const queueLimit = options.queueLimit ?? DEFAULT_QUEUE_LIMIT;
  const outboundPolicy = options.outboundPolicy ?? 'strip';
  const warn =
    options.warn ?? ((line: string) => process.stderr.write(`[graphorin/channels] ${line}\n`));

  const runtimes = new Map<string, ChannelRuntime>();
  for (const adapter of options.adapters) {
    runtimes.set(adapter.id, {
      adapter,
      queue: [],
      draining: false,
      queuedTotal: 0,
      dropped: 0,
      processed: 0,
      denied: 0,
      failed: 0,
      delivered: 0,
      deliveryFailures: 0,
    });
  }

  let running = false;
  let controller = new AbortController();
  let onActivity: (() => void) | undefined;
  /** In-flight drain loops; awaited on stop so no work outlives the gateway. */
  const drains = new Set<Promise<void>>();

  function sanitizeReplyPayload(payload: DeliveryPayload): DeliveryPayload {
    const text = sanitizeChannelOutbound(payload.text, outboundPolicy).text;
    const question: DeliveryQuestion | undefined =
      payload.question === undefined
        ? undefined
        : {
            ...payload.question,
            prompt: sanitizeChannelOutbound(payload.question.prompt, outboundPolicy).text,
          };
    return { ...payload, text, ...(question !== undefined ? { question } : {}) };
  }

  async function deliverTo(runtime: ChannelRuntime, payload: DeliveryPayload) {
    try {
      const receipt = await runtime.adapter.deliver(sanitizeReplyPayload(payload));
      runtime.delivered += 1;
      return receipt;
    } catch (err) {
      runtime.deliveryFailures += 1;
      throw err;
    }
  }

  function replyIo(runtime: ChannelRuntime, message: InboundChannelMessage) {
    return async (reply: ChannelReply): Promise<DeliveryReceipt> =>
      deliverTo(runtime, {
        identity: message.identity,
        text: reply.text,
        replyTo: message.messageId,
        ...(reply.question !== undefined ? { question: reply.question } : {}),
      });
  }

  async function processOne(runtime: ChannelRuntime, message: InboundChannelMessage) {
    const decision = await options.access.check(message.identity);
    if (decision.kind !== 'allow') {
      runtime.denied += 1;
      if (options.onUnauthorized !== undefined) {
        await options.onUnauthorized(message, decision, {
          deliver: replyIo(runtime, message),
        });
      }
      return;
    }
    const sanitization = sanitizeChannelInbound(message.text, {
      channelId: message.identity.channelId,
    });
    if (sanitization.blocked) {
      runtime.failed += 1;
      warn(
        `inbound message ${message.messageId} on '${runtime.adapter.id}' dropped: ` +
          'sanitization scan blocked (fail-closed)',
      );
      return;
    }
    const route = options.router.resolve(message.identity);
    const reply = await options.onMessage({
      message,
      sanitizedText: sanitization.body,
      sanitization,
      route,
      inboundTaint: {
        text: message.text,
        sourceKind: `channel:${message.identity.channelId}`,
      },
      deliver: replyIo(runtime, message),
    });
    if (reply !== undefined && reply !== null) {
      await deliverTo(runtime, {
        identity: message.identity,
        text: reply.text,
        replyTo: message.messageId,
        ...(reply.question !== undefined ? { question: reply.question } : {}),
      });
    }
  }

  function drain(runtime: ChannelRuntime): void {
    if (runtime.draining) return;
    runtime.draining = true;
    const loop = (async () => {
      while (running) {
        const message = runtime.queue.shift();
        if (message === undefined) break;
        try {
          await processOne(runtime, message);
          runtime.processed += 1;
        } catch (err) {
          runtime.failed += 1;
          warn(
            `handler failed for message ${message.messageId} on '${runtime.adapter.id}': ` +
              `${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
      runtime.draining = false;
    })();
    drains.add(loop);
    void loop.finally(() => drains.delete(loop));
  }

  async function start(): Promise<void> {
    if (running) return;
    running = true;
    controller = new AbortController();
    for (const runtime of runtimes.values()) {
      await runtime.adapter.start({
        signal: controller.signal,
        onInbound: async (message) => {
          if (!running) return { accepted: false, reason: 'stopped' };
          if (runtime.queue.length >= queueLimit) {
            runtime.dropped += 1;
            warn(
              `inbound queue full on '${runtime.adapter.id}' ` +
                `(${queueLimit}); shedding message ${message.messageId}`,
            );
            return { accepted: false, reason: 'queue-full' };
          }
          runtime.queue.push(message);
          runtime.queuedTotal += 1;
          try {
            onActivity?.();
          } catch {
            // The activity listener must never break intake.
          }
          drain(runtime);
          return { accepted: true };
        },
      });
    }
  }

  async function stop(): Promise<void> {
    if (!running) return;
    running = false;
    controller.abort();
    for (const runtime of runtimes.values()) {
      try {
        await runtime.adapter.stop();
      } catch (err) {
        warn(
          `adapter '${runtime.adapter.id}' failed to stop cleanly: ` +
            `${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    await Promise.allSettled([...drains]);
  }

  async function status(): Promise<ChannelGatewayStatus> {
    return {
      running,
      channels: [...runtimes.values()].map((runtime) => ({
        id: runtime.adapter.id,
        queued: runtime.queue.length,
        dropped: runtime.dropped,
        processed: runtime.processed,
        denied: runtime.denied,
        failed: runtime.failed,
        delivered: runtime.delivered,
        deliveryFailures: runtime.deliveryFailures,
      })),
    };
  }

  async function deliver(payload: DeliveryPayload): Promise<DeliveryReceipt> {
    const runtime = runtimes.get(payload.identity.channelId);
    if (runtime === undefined) {
      throw new ChannelGatewayConfigError(
        `no adapter registered for channel '${payload.identity.channelId}'`,
      );
    }
    return deliverTo(runtime, payload);
  }

  return {
    start,
    stop,
    status,
    deliver,
    setActivityListener(listener) {
      onActivity = listener;
    },
  };
}
