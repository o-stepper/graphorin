/**
 * Tiny in-memory WebSocket double for unit tests. Implements the
 * surface `@graphorin/client` consumes (constructor with subprotocol
 * list, `addEventListener` / `removeEventListener` for `'open'`,
 * `'message'`, `'error'`, `'close'`, the `protocol` getter, the
 * `readyState` slot, the `send` + `close` methods).
 */

import type { ServerMessage } from '@graphorin/protocol';
import { SUBPROTOCOL_NAME } from '@graphorin/protocol';

type Listener = (event: Event | MessageEvent | CloseEvent) => void;

const REGISTRY: MockWebSocket[] = [];

export interface MockWebSocketConfig {
  /**
   * Override the subprotocol the mock advertises after `open`.
   * Defaults to the first subprotocol the constructor received that
   * matches `SUBPROTOCOL_NAME`, otherwise an empty string.
   */
  negotiatedProtocol?: string;
  /** Skip the automatic `open` event so tests can drive the lifecycle. */
  manualOpen?: boolean;
}

let nextConfig: MockWebSocketConfig = {};

export function configureNextSocket(config: MockWebSocketConfig): void {
  nextConfig = config;
}

export class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  protocol = '';
  url: string;
  bufferedAmount = 0;

  readonly subprotocols: ReadonlyArray<string>;
  readonly #listeners = new Map<string, Set<Listener>>();
  readonly sent: string[] = [];
  closeArgs: { code?: number; reason?: string } | undefined;

  constructor(url: string, subprotocols?: string | ReadonlyArray<string>) {
    this.url = url;
    const list =
      typeof subprotocols === 'string'
        ? [subprotocols]
        : Array.isArray(subprotocols)
          ? Array.from(subprotocols)
          : [];
    this.subprotocols = list;
    const config = nextConfig;
    nextConfig = {};
    REGISTRY.push(this);
    if (config.negotiatedProtocol !== undefined) {
      this.protocol = config.negotiatedProtocol;
    } else {
      this.protocol = list.includes(SUBPROTOCOL_NAME) ? SUBPROTOCOL_NAME : (list[0] ?? '');
    }
    if (config.manualOpen !== true) {
      queueMicrotask(() => this.fireOpen());
    }
  }

  addEventListener(type: string, listener: Listener): void {
    let set = this.#listeners.get(type);
    if (set === undefined) {
      set = new Set();
      this.#listeners.set(type, set);
    }
    set.add(listener);
  }

  removeEventListener(type: string, listener: Listener): void {
    const set = this.#listeners.get(type);
    set?.delete(listener);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error(`MockWebSocket.send called in state ${this.readyState}.`);
    }
    this.sent.push(data);
  }

  close(code?: number, reason?: string): void {
    if (this.readyState === MockWebSocket.CLOSED) return;
    this.readyState = MockWebSocket.CLOSED;
    this.closeArgs = {
      ...(code !== undefined ? { code } : {}),
      ...(reason !== undefined ? { reason } : {}),
    };
    queueMicrotask(() => {
      this.dispatch('close', {
        type: 'close',
        code: code ?? 1000,
        reason: reason ?? '',
        wasClean: code === undefined || code === 1000,
      } as unknown as CloseEvent);
    });
  }

  fireMessage(frame: ServerMessage | string): void {
    const data = typeof frame === 'string' ? frame : JSON.stringify(frame);
    this.dispatch('message', { type: 'message', data, lastEventId: '' } as unknown as MessageEvent);
  }

  fireServerClose(code: number, reason: string): void {
    if (this.readyState === MockWebSocket.CLOSED) return;
    this.readyState = MockWebSocket.CLOSED;
    this.dispatch('close', {
      type: 'close',
      code,
      reason,
      wasClean: false,
    } as unknown as CloseEvent);
  }

  fireError(): void {
    this.dispatch('error', { type: 'error' });
  }

  fireOpen(): void {
    if (this.readyState !== MockWebSocket.CONNECTING) return;
    this.readyState = MockWebSocket.OPEN;
    this.dispatch('open', { type: 'open' });
  }

  private dispatch(type: string, event: Event | MessageEvent | CloseEvent): void {
    const set = this.#listeners.get(type);
    if (set === undefined) return;
    for (const listener of set) listener(event);
  }
}

export function lastSocket(): MockWebSocket {
  const socket = REGISTRY.at(-1);
  if (socket === undefined) {
    throw new Error('No MockWebSocket has been created yet.');
  }
  return socket;
}

export function resetMockTransport(): void {
  REGISTRY.length = 0;
  nextConfig = {};
}
