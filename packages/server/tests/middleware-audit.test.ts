import type { AuditDb, AuditEntryInput, StoredAuditEntry } from '@graphorin/security/audit';
import { type ParsedScope, parseScope } from '@graphorin/security/auth';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import type { ServerVariables } from '../src/internal/context.js';
import { createAuditMiddleware, HTTP_REQUEST_AUDIT_ACTION } from '../src/middleware/audit.js';
import { createRequestStateMiddleware } from '../src/middleware/request-state.js';

class InMemoryAuditDb implements AuditDb {
  readonly binding = 'in-memory' as const;
  readonly path = ':memory:';
  readonly entries: StoredAuditEntry[] = [];

  async insert(entry: StoredAuditEntry): Promise<StoredAuditEntry> {
    this.entries.push(entry);
    return entry;
  }
  async latest(): Promise<StoredAuditEntry | undefined> {
    return this.entries.at(-1);
  }
  async *iterate(): AsyncIterable<StoredAuditEntry> {
    for (const e of this.entries) yield e;
  }
  async count(): Promise<number> {
    return this.entries.length;
  }
  async deleteUpTo(threshold: number): Promise<number> {
    const before = this.entries.length;
    while (this.entries.length > 0 && (this.entries[0]?.seq ?? 0) <= threshold) {
      this.entries.shift();
    }
    return before - this.entries.length;
  }
  async replaceEntry(entry: StoredAuditEntry): Promise<void> {
    const idx = this.entries.findIndex((e) => e.seq === entry.seq);
    if (idx >= 0) this.entries[idx] = entry;
  }
  async close(): Promise<void> {}
}

function buildApp(audit: AuditDb, opts: { failingAudit?: boolean } = {}) {
  const app = new Hono<{ Variables: ServerVariables }>();
  app.use('*', createRequestStateMiddleware());
  app.use('*', async (c, next) => {
    // Stub auth: surface a token directly so we can test the audit
    // middleware in isolation.
    const grantedScopes: ParsedScope[] = [parseScope('agents:read')];
    c.set('state', {
      ...c.get('state'),
      auth: {
        kind: 'token' as const,
        token: {
          tokenId: 'tok_abc',
          label: 'ci',
          scopes: Object.freeze(grantedScopes),
          env: 'live',
        },
        grantedScopes: Object.freeze(grantedScopes),
      },
    });
    await next();
  });
  app.use(
    '*',
    createAuditMiddleware({
      auditDb: audit,
      ...(opts.failingAudit
        ? {
            onError: (_err, _entry: Omit<AuditEntryInput, 'ts'>) => {
              // Sink invoked on append failure; nothing more to assert.
            },
          }
        : {}),
    }),
  );
  app.get('/echo', (c) => c.json({ ok: true }));
  app.get('/forbidden', (c) => c.json({ error: 'scope-denied' }, 403));
  app.get('/error', (c) => c.json({ error: 'oops' }, 500));
  return app;
}

describe('createAuditMiddleware', () => {
  it("emits an entry with action='http:request' on every authenticated 2xx", async () => {
    const audit = new InMemoryAuditDb();
    const app = buildApp(audit);
    const res = await app.request('/echo');
    expect(res.status).toBe(200);
    expect(audit.entries).toHaveLength(1);
    const entry = audit.entries[0];
    if (entry === undefined) throw new Error('expected audit entry');
    expect(entry.action).toBe(HTTP_REQUEST_AUDIT_ACTION);
    expect(entry.actor.kind).toBe('token');
    expect(entry.actor.id).toBe('tok_abc');
    expect(entry.target).toBe('/echo');
    expect(entry.decision).toBe('success');
    expect(entry.metadata?.method).toBe('GET');
    expect(entry.metadata?.status).toBe(200);
    expect(entry.metadata?.requestId).toBeDefined();
  });

  it("emits decision='denied' on 4xx and decision='error' on 5xx", async () => {
    const audit = new InMemoryAuditDb();
    const app = buildApp(audit);
    await app.request('/forbidden');
    await app.request('/error');
    expect(audit.entries.map((e) => e.decision)).toEqual(['denied', 'error']);
  });

  it('does not audit anonymous calls', async () => {
    const audit = new InMemoryAuditDb();
    const app = new Hono<{ Variables: ServerVariables }>();
    app.use('*', createRequestStateMiddleware());
    app.use('*', createAuditMiddleware({ auditDb: audit }));
    app.get('/x', (c) => c.json({ ok: true }));
    await app.request('/x');
    expect(audit.entries).toHaveLength(0);
  });

  it('survives append failures via the onError sink', async () => {
    const errors: unknown[] = [];
    const failingAudit: AuditDb = {
      binding: 'failing',
      path: ':memory:',
      async insert() {
        throw new Error('disk full');
      },
      async latest() {
        return undefined;
      },
      async *iterate() {},
      async count() {
        return 0;
      },
      async deleteUpTo() {
        return 0;
      },
      async replaceEntry() {},
      async close() {},
    };
    const app = new Hono<{ Variables: ServerVariables }>();
    app.use('*', createRequestStateMiddleware());
    app.use('*', async (c, next) => {
      const grantedScopes: ParsedScope[] = [parseScope('agents:read')];
      c.set('state', {
        ...c.get('state'),
        auth: {
          kind: 'token' as const,
          token: {
            tokenId: 'tok_abc',
            label: 'ci',
            scopes: Object.freeze(grantedScopes),
            env: 'live',
          },
          grantedScopes: Object.freeze(grantedScopes),
        },
      });
      await next();
    });
    app.use(
      '*',
      createAuditMiddleware({
        auditDb: failingAudit,
        onError: (err) => {
          errors.push(err);
        },
      }),
    );
    app.get('/x', (c) => c.json({ ok: true }));
    const res = await app.request('/x');
    expect(res.status).toBe(200);
    expect(errors).toHaveLength(1);
  });

  it('omits metadata when recordMetadata: false', async () => {
    const audit = new InMemoryAuditDb();
    const app = new Hono<{ Variables: ServerVariables }>();
    app.use('*', createRequestStateMiddleware());
    app.use('*', async (c, next) => {
      const grantedScopes: ParsedScope[] = [parseScope('agents:read')];
      c.set('state', {
        ...c.get('state'),
        auth: {
          kind: 'token' as const,
          token: {
            tokenId: 'tok_abc',
            scopes: Object.freeze(grantedScopes),
            env: 'live',
          },
          grantedScopes: Object.freeze(grantedScopes),
        },
      });
      await next();
    });
    app.use('*', createAuditMiddleware({ auditDb: audit, recordMetadata: false }));
    app.get('/x', (c) => c.json({ ok: true }));
    await app.request('/x');
    expect(audit.entries[0]?.metadata).toBeUndefined();
  });
});
