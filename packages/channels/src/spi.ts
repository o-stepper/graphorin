/**
 * Channel SPI: the vendor-neutral contract between a messenger
 * adapter (Telegram, Slack, e-mail, a CLI pipe) and the Graphorin
 * gateway runtime.
 *
 * Adapters normalize vendor payloads into {@link InboundChannelMessage}
 * and hand them to the gateway callback - never straight into an
 * agent run. The gateway owns the trust boundary (sanitization,
 * taint), the access policy (pairing) and the identity routing;
 * adapters own transport, credentials and rendering.
 *
 * Naming note (deliberate): this package exports no symbol named
 * `Channel` or `ChannelKind` - those belong to the workflow
 * state-merge primitives in `@graphorin/core/channels`.
 *
 * @packageDocumentation
 */

/**
 * The identity triple of a remote conversation. All three segments
 * are adapter-scoped opaque strings:
 *
 *  - `channelId` - the adapter instance (`'telegram'`, `'slack-work'`),
 *  - `accountId` - the bot/account identity on that channel,
 *  - `peerId` - the remote peer (user, chat, thread).
 *
 * The triple is a ROUTING SELECTOR, never an authorization token:
 * peers assert their own identity through the vendor transport, so
 * authorization decisions belong to the access policy (pairing /
 * allowlist), not to string comparison on the triple.
 *
 * @stable
 */
export interface ChannelIdentity {
  readonly channelId: string;
  readonly accountId: string;
  readonly peerId: string;
}

/**
 * Static feature flags an adapter advertises so the gateway and the
 * application can shape output without vendor-specific branching.
 *
 * @stable
 */
export interface ChannelCapabilities {
  /** The channel can edit an already-delivered message in place. */
  readonly edit: boolean;
  /** The channel supports a typing / progress indicator. */
  readonly typing: boolean;
  /** The channel can carry voice notes (see the `SttAdapter` contract in `@graphorin/core/contracts`). */
  readonly voice: boolean;
  /** Hard per-message text length limit, in UTF-16 code units. */
  readonly maxTextLength: number;
}

/**
 * A non-text part attached to an inbound message. The adapter
 * resolves vendor handles into either an inline body or a URL it
 * guarantees the application can fetch.
 *
 * @stable
 */
export interface ChannelAttachment {
  readonly kind: 'image' | 'audio' | 'file';
  readonly mimeType?: string;
  /** Inline body (small payloads). */
  readonly data?: Uint8Array;
  /** Remote reference (large payloads); adapter-scoped semantics. */
  readonly url?: string;
  readonly filename?: string;
  readonly sizeBytes?: number;
}

/**
 * A normalized inbound message. Produced by the adapter, consumed by
 * the gateway pipeline (policy -> sanitization -> routing -> handler).
 *
 * @stable
 */
export interface InboundChannelMessage {
  readonly identity: ChannelIdentity;
  /** Channel-native message id (dedup + audit). */
  readonly messageId: string;
  /**
   * Normalized plain text. Empty string for attachment-only
   * messages. UNTRUSTED by definition - the gateway sanitizes it and
   * labels the run's taint ledger before any agent sees it.
   */
  readonly text: string;
  readonly attachments?: ReadonlyArray<ChannelAttachment>;
  /** Reply context, when the peer replied to an earlier message. */
  readonly replyTo?: {
    readonly messageId: string;
    /** Short excerpt of the quoted message, when the vendor supplies one. */
    readonly excerpt?: string;
  };
  /** ISO-8601 receive timestamp (adapter clock). */
  readonly receivedAt: string;
  /**
   * The raw vendor payload, kept for audit only. The gateway never
   * feeds it to a model and never routes on it.
   */
  readonly raw?: unknown;
}

/**
 * Result of handing an inbound message to the gateway. Adapters use
 * the rejection reasons to react at the transport level (e.g. slow a
 * poller down on `'queue-full'`).
 *
 * @stable
 */
export interface InboundAcceptance {
  readonly accepted: boolean;
  /** Present when `accepted` is false. */
  readonly reason?: 'queue-full' | 'stopped';
}

/**
 * Runtime context handed to {@link ChannelAdapter.start}. The adapter
 * pushes normalized inbound messages through `onInbound` and observes
 * `signal` for shutdown.
 *
 * @stable
 */
export interface ChannelRuntimeContext {
  /**
   * Enqueue a normalized inbound message. Resolves once the message
   * is accepted into (or shed from) the gateway's bounded queue -
   * NOT once it has been processed.
   */
  onInbound(message: InboundChannelMessage): Promise<InboundAcceptance>;
  /** Aborted when the gateway stops; adapters should cease polling/subscriptions. */
  readonly signal: AbortSignal;
}

/**
 * An interactive question rendered on the channel (HITL surface).
 * `ref` is the opaque resolve reference the application posts back
 * to the framework: either a serialized workflow awakeable address
 * (`serializeAwakeableRef` from `@graphorin/workflow`) or an agent
 * approval id. Rendering (buttons, quick replies, plain text) is the
 * adapter's choice.
 *
 * @stable
 */
export interface DeliveryQuestion {
  readonly prompt: string;
  readonly options: ReadonlyArray<{ readonly label: string; readonly value: string }>;
  readonly ref: string;
}

/**
 * An outbound delivery. `text` is expected to be pre-sanitized by the
 * gateway (outbound commentary catalogue); adapters must not add
 * model-facing scaffolding of their own.
 *
 * @stable
 */
export interface DeliveryPayload {
  readonly identity: ChannelIdentity;
  readonly text: string;
  /** Channel-native id of the message this delivery replies to. */
  readonly replyTo?: string;
  /** Optional interactive question (see {@link DeliveryQuestion}). */
  readonly question?: DeliveryQuestion;
}

/**
 * Acknowledgement returned by a successful {@link ChannelAdapter.deliver}.
 *
 * @stable
 */
export interface DeliveryReceipt {
  /** Channel-native id of the delivered message, when the vendor returns one. */
  readonly messageId?: string;
  /** ISO-8601 delivery timestamp (adapter clock). */
  readonly deliveredAt: string;
}

/**
 * Typed failure for {@link ChannelAdapter.deliver}. Delivery is
 * fire-and-forget at the framework level (no durable outbox by
 * design - D-14): the adapter owns bounded in-call retries and
 * throws this error once they are exhausted. `retryable` tells the
 * caller whether a LATER re-send could succeed.
 *
 * @stable
 */
export class ChannelDeliveryError extends Error {
  override readonly name = 'ChannelDeliveryError';
  constructor(
    public readonly channelId: string,
    message: string,
    public readonly retryable: boolean = false,
    options?: { readonly cause?: unknown },
  ) {
    super(`[graphorin/channels] deliver on '${channelId}' failed: ${message}`, options);
  }
}

/**
 * The adapter contract. One instance per channel account; the
 * gateway drives the lifecycle (`start` on gateway start, `stop` on
 * gateway stop) and calls `deliver` for outbound traffic.
 *
 * Implementations live in application repositories and are validated
 * against the conformance suite in `@graphorin/channels/testkit`.
 *
 * @stable
 */
export interface ChannelAdapter {
  /** Stable channel id; becomes `ChannelIdentity.channelId` on inbound. */
  readonly id: string;
  readonly capabilities: ChannelCapabilities;
  /** Subscribe / start polling. Resolves once the adapter is receiving. */
  start(ctx: ChannelRuntimeContext): Promise<void>;
  /** Stop receiving; idempotent. */
  stop(): Promise<void>;
  /**
   * Deliver one outbound payload. Throws {@link ChannelDeliveryError}
   * after in-call retries are exhausted (D-14: no durable outbox).
   */
  deliver(payload: DeliveryPayload): Promise<DeliveryReceipt>;
}

/**
 * Structural check for {@link ChannelDeliveryError} that survives
 * package-boundary `instanceof` failures (matched by `name`, the
 * same convention as `EmbedderLockOnFirstError`).
 *
 * @stable
 */
export function isChannelDeliveryError(err: unknown): err is ChannelDeliveryError {
  return err instanceof Error && err.name === 'ChannelDeliveryError';
}
