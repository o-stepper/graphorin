/**
 * Tiny in-memory EventSource double for unit tests.
 */

type Listener = (event: Event | MessageEvent) => void;

const REGISTRY: MockEventSource[] = [];

export class MockEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  readyState: number = MockEventSource.CONNECTING;
  url: string;
  withCredentials = false;

  readonly #listeners = new Map<string, Set<Listener>>();
  readonly init: { headers?: Record<string, string> };
  closed = false;

  constructor(
    url: string,
    init: { withCredentials?: boolean; headers?: Record<string, string> } = {},
  ) {
    this.url = url;
    this.init = init;
    if (init.withCredentials !== undefined) this.withCredentials = init.withCredentials;
    REGISTRY.push(this);
    queueMicrotask(() => this.fireOpen());
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
    this.#listeners.get(type)?.delete(listener);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.readyState = MockEventSource.CLOSED;
  }

  fireMessage(data: string, lastEventId = ''): void {
    this.#dispatch('message', { type: 'message', data, lastEventId } as unknown as MessageEvent);
  }

  fireError(): void {
    this.#dispatch('error', { type: 'error' });
  }

  fireOpen(): void {
    if (this.readyState !== MockEventSource.CONNECTING) return;
    this.readyState = MockEventSource.OPEN;
    this.#dispatch('open', { type: 'open' });
  }

  #dispatch(type: string, event: Event | MessageEvent): void {
    const set = this.#listeners.get(type);
    if (set === undefined) return;
    for (const listener of set) listener(event);
  }
}

export function lastEventSource(): MockEventSource {
  const inst = REGISTRY.at(-1);
  if (inst === undefined) throw new Error('No MockEventSource has been created yet.');
  return inst;
}

export function resetMockEventSource(): void {
  REGISTRY.length = 0;
}
