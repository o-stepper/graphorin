/**
 * Typed error hierarchy surfaced by `@graphorin/client`. Every error
 * class extends the JavaScript built-in `Error` and exposes a stable
 * `kind` discriminator so consumers can pattern-match without
 * relying on `instanceof` (which behaves badly across module-system
 * boundaries when the package is dual-loaded).
 *
 * @packageDocumentation
 */

/**
 * Discriminator union of every error kind raised by the client.
 *
 * @stable
 */
export type GraphorinClientErrorKind =
  | 'client-not-connected'
  | 'transport-failed'
  | 'subprotocol-mismatch'
  | 'auth-failed'
  | 'protocol-violation'
  | 'subscription-not-found'
  | 'aborted'
  | 'invalid-server-frame';

/**
 * Base class for every error raised by `@graphorin/client`. Carries a
 * stable {@link GraphorinClientErrorKind} discriminator and an
 * optional `cause` chain.
 *
 * @stable
 */
export class GraphorinClientError extends Error {
  readonly kind: GraphorinClientErrorKind;

  constructor(kind: GraphorinClientErrorKind, message: string, options: ErrorOptions = {}) {
    super(message, options);
    this.kind = kind;
    this.name = 'GraphorinClientError';
  }
}

/** @stable */
export class ClientNotConnectedError extends GraphorinClientError {
  constructor(message = 'GraphorinClient is not connected. Call connect() first.') {
    super('client-not-connected', message);
    this.name = 'ClientNotConnectedError';
  }
}

/** @stable */
export class TransportFailedError extends GraphorinClientError {
  readonly code: number | undefined;

  constructor(message: string, options: ErrorOptions & { readonly code?: number } = {}) {
    super('transport-failed', message, options);
    this.name = 'TransportFailedError';
    this.code = options.code;
  }
}

/** @stable */
export class SubprotocolMismatchError extends GraphorinClientError {
  readonly expected: string;
  readonly actual: string | null;

  constructor(expected: string, actual: string | null) {
    super(
      'subprotocol-mismatch',
      `Server selected subprotocol '${actual ?? '<none>'}'; expected '${expected}'.`,
    );
    this.name = 'SubprotocolMismatchError';
    this.expected = expected;
    this.actual = actual;
  }
}

/** @stable */
export class AuthFailedError extends GraphorinClientError {
  constructor(message = 'Authentication failed. Re-mint a token or request a new ticket.') {
    super('auth-failed', message);
    this.name = 'AuthFailedError';
  }
}

/** @stable */
export class ProtocolViolationError extends GraphorinClientError {
  constructor(message: string, options: ErrorOptions = {}) {
    super('protocol-violation', message, options);
    this.name = 'ProtocolViolationError';
  }
}

/** @stable */
export class SubscriptionNotFoundError extends GraphorinClientError {
  readonly subscriptionId: string;

  constructor(subscriptionId: string) {
    super(
      'subscription-not-found',
      `Subscription '${subscriptionId}' is not active on this client.`,
    );
    this.name = 'SubscriptionNotFoundError';
    this.subscriptionId = subscriptionId;
  }
}

/** @stable */
export class ClientAbortedError extends GraphorinClientError {
  constructor(message = 'Operation aborted before completion.') {
    super('aborted', message);
    this.name = 'ClientAbortedError';
  }
}

/** @stable */
export class InvalidServerFrameError extends GraphorinClientError {
  readonly issues: ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>;

  constructor(
    message: string,
    issues: ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>,
  ) {
    super('invalid-server-frame', message);
    this.name = 'InvalidServerFrameError';
    this.issues = issues;
  }
}
