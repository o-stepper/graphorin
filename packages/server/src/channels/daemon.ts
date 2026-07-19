/**
 * Channels daemon adapter: hosts a channel gateway (the front-door
 * runtime from `@graphorin/channels`) inside the server lifecycle.
 *
 * Structural typing on purpose - the server matches the gateway by
 * SHAPE ({@link ChannelGatewayLike}), never by importing the channels
 * package, mirroring `WorkflowTimerDriverLike` / `ConsolidatorLike`.
 * A future gateway revision (or a hand-rolled gateway) plugs in as
 * long as the shape holds.
 *
 * @packageDocumentation
 */

/** Per-channel status counters the gateway reports. @stable */
export interface ChannelStatusLike {
  readonly id: string;
  readonly queued: number;
  readonly dropped: number;
  readonly processed: number;
  readonly denied: number;
  readonly failed: number;
  readonly delivered: number;
  readonly deliveryFailures: number;
}

/** Gateway status shape consumed by `/v1/health`. @stable */
export interface ChannelGatewayStatusLike {
  readonly running: boolean;
  readonly channels: ReadonlyArray<ChannelStatusLike>;
}

/**
 * Structural surface of a channel gateway
 * (`createChannelGateway(...)` from `@graphorin/channels` satisfies
 * it; the server never imports that package).
 *
 * @stable
 */
export interface ChannelGatewayLike {
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): Promise<ChannelGatewayStatusLike>;
  /**
   * Bridge seam: when present, the server registers a listener
   * that records scheduler activity on every accepted inbound
   * message (idle-trigger debounce).
   */
  setActivityListener?(listener: (() => void) | undefined): void;
}

/** Options for {@link createChannelsDaemon}. @stable */
export interface CreateChannelsDaemonOptions {
  readonly gateway: ChannelGatewayLike;
  /** Hard ceiling on `stop()`. Default 10s. */
  readonly stopTimeoutMs?: number;
  readonly warn?: (line: string) => void;
}

/**
 * @stable
 */
export interface ChannelsDaemon {
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): Promise<ChannelGatewayStatusLike>;
  readonly gateway: ChannelGatewayLike;
}

/**
 * Wrap a channel gateway in the managed-daemon surface the lifecycle
 * drives (idempotent start/stop, bounded stop).
 *
 * @stable
 */
export function createChannelsDaemon(options: CreateChannelsDaemonOptions): ChannelsDaemon {
  const stopTimeoutMs = options.stopTimeoutMs ?? 10_000;
  const warn = options.warn ?? ((m: string) => process.stderr.write(`${m}\n`));
  let started = false;

  return {
    get gateway() {
      return options.gateway;
    },
    async start() {
      if (started) return;
      started = true;
      await options.gateway.start();
    },
    async stop() {
      if (!started) return;
      started = false;
      try {
        await withTimeout(options.gateway.stop(), stopTimeoutMs);
      } catch (err) {
        warn(
          `[graphorin/server] channels daemon: stop() exceeded ${stopTimeoutMs}ms; force-abandoning (${describeError(err)}).`,
        );
      }
    },
    async status() {
      return options.gateway.status();
    },
  };
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`timeout after ${ms}ms`));
    }, ms);
    p.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function describeError(err: unknown): string {
  if (err === null || err === undefined) return 'unknown';
  if (err instanceof Error) return err.message;
  return String(err);
}
