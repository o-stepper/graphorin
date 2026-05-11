/**
 * Coverage for the typed error hierarchy. Every error class exported by
 * the package gets a smoke-test that confirms the discriminant `kind`,
 * the message shape, and (where applicable) the carried metadata.
 */
import { describe, expect, it } from 'vitest';

import {
  CostBudgetExceededError,
  GraphorinProviderError,
  InvalidProviderError,
  LocalProviderInsecureTransportError,
  MiddlewareOrderingError,
  MissingProductionMiddlewareError,
  OllamaInsecureTransportError,
  PromptRedactionError,
  ProviderHttpError,
  ProviderStreamParseError,
  RateLimitExceededError,
} from '../src/errors/errors.js';

describe('GraphorinProviderError', () => {
  it('attaches the discriminant kind and optional hint', () => {
    const err = new GraphorinProviderError('demo-kind', 'demo message', {
      hint: 'fix it',
    });
    expect(err.kind).toBe('demo-kind');
    expect(err.message).toBe('demo message');
    expect(err.hint).toBe('fix it');
    expect(err.name).toBe('GraphorinProviderError');
  });

  it('forwards the cause when supplied', () => {
    const cause = new Error('underlying');
    const err = new GraphorinProviderError('k', 'm', { cause });
    expect(err.cause).toBe(cause);
  });
});

describe('MiddlewareOrderingError', () => {
  it('captures the offending pair and the canonical order', () => {
    const err = new MiddlewareOrderingError({
      offendingPair: ['withRetry', 'withTracing'],
      canonicalOrder: ['withTracing', 'withRetry'],
    });
    expect(err.kind).toBe('middleware-ordering');
    expect(err.offendingPair).toEqual(['withRetry', 'withTracing']);
    expect(err.message).toContain('withRetry');
    expect(err.message).toContain('withTracing');
  });
});

describe('MissingProductionMiddlewareError', () => {
  it('records the missing middleware kind', () => {
    const err = new MissingProductionMiddlewareError('withRedaction');
    expect(err.kind).toBe('missing-production-middleware');
    expect(err.missing).toBe('withRedaction');
    expect(err.message).toContain('withRedaction');
  });
});

describe('CostBudgetExceededError', () => {
  it('formats the scope, observed and limit values', () => {
    const err = new CostBudgetExceededError({ scope: 'session', limit: 1, observed: 2 });
    expect(err.kind).toBe('cost-budget-exceeded');
    expect(err.scope).toBe('session');
    expect(err.limit).toBe(1);
    expect(err.observed).toBe(2);
    expect(err.message).toContain('session');
    expect(err.message).toContain('USD');
  });

  it('honours an explicit currency override', () => {
    const err = new CostBudgetExceededError({
      scope: 'run',
      limit: 1,
      observed: 2,
      currency: 'EUR',
    });
    expect(err.message).toContain('EUR');
  });
});

describe('RateLimitExceededError', () => {
  it('exposes the retryAfterMs hint in the message', () => {
    const err = new RateLimitExceededError(1234);
    expect(err.kind).toBe('rate-limit-exceeded');
    expect(err.retryAfterMs).toBe(1234);
    expect(err.message).toContain('1234');
  });
});

describe('PromptRedactionError', () => {
  it('captures patternName + fieldPath + role', () => {
    const err = new PromptRedactionError({
      patternName: 'openai-key',
      fieldPath: 'messages[0].content',
      role: 'user',
    });
    expect(err.kind).toBe('prompt-redaction-fail-closed');
    expect(err.patternName).toBe('openai-key');
    expect(err.fieldPath).toBe('messages[0].content');
    expect(err.role).toBe('user');
    expect(err.message).toContain('openai-key');
    expect(err.message).toContain('user');
  });

  it('omits the role suffix when role is unset', () => {
    const err = new PromptRedactionError({ patternName: 'p', fieldPath: 'f' });
    expect(err.message).not.toContain('role:');
    expect(err.role).toBeUndefined();
  });
});

describe('LocalProviderInsecureTransportError', () => {
  it('records the offending baseUrl', () => {
    const err = new LocalProviderInsecureTransportError('http://5.6.7.8:80');
    expect(err.kind).toBe('local-provider-insecure-transport');
    expect(err.baseUrl).toBe('http://5.6.7.8:80');
    expect(err.message).toContain('http://5.6.7.8:80');
  });

  it('OllamaInsecureTransportError is the same constructor (legacy alias)', () => {
    expect(OllamaInsecureTransportError).toBe(LocalProviderInsecureTransportError);
    const err = new OllamaInsecureTransportError('http://example.com:80');
    expect(err).toBeInstanceOf(LocalProviderInsecureTransportError);
  });
});

describe('ProviderHttpError', () => {
  it('formats provider + status + message and forwards the cause', () => {
    const cause = new Error('ECONNREFUSED');
    const err = new ProviderHttpError({
      providerName: 'fixture',
      status: 503,
      message: 'service unavailable',
      cause,
    });
    expect(err.kind).toBe('provider-http');
    expect(err.providerName).toBe('fixture');
    expect(err.status).toBe(503);
    expect(err.message).toBe('[fixture] HTTP 503: service unavailable');
    expect(err.cause).toBe(cause);
  });
});

describe('ProviderStreamParseError', () => {
  it('formats provider name + message and forwards the cause', () => {
    const cause = new SyntaxError('bad json');
    const err = new ProviderStreamParseError('fixture', 'malformed payload', cause);
    expect(err.kind).toBe('provider-stream-parse');
    expect(err.providerName).toBe('fixture');
    expect(err.message).toBe('[fixture] malformed payload');
    expect(err.cause).toBe(cause);
  });
});

describe('InvalidProviderError', () => {
  it('attaches the invalid-provider kind and a remediation hint', () => {
    const err = new InvalidProviderError('not a provider');
    expect(err.kind).toBe('invalid-provider');
    expect(err.message).toBe('not a provider');
    expect(err.hint).toContain('createProvider');
  });
});
