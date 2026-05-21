/**
 * Graphorin v0.2.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Smoke coverage for `examples/slack-bot-integration`. Every test runs
 * against an in-memory SQLite store and stubs the Slack `WebClient`
 * plus the LLM provider so CI never touches the network. Scenarios:
 *
 *   1. Canonical version constant.
 *   2. {@link processSlackEvent} happy-path: a small Slack message is
 *      forwarded into the agent and the deterministic stub reply is
 *      mirrored back via `chat.postMessage`.
 *   3. {@link simulateApprovalLifecycle} end-to-end: a $500 expense
 *      submission pauses the agent on `tool.approval.requested`, the
 *      bridge posts an "approval needed" Slack message, the SQLite
 *      `CheckpointStore` survives a simulated server restart (close +
 *      re-open the store, re-create the agent), and an operator
 *      "approve" decision resumes the agent + posts a final message.
 *   4. Token-based auth: the Hono app rejects unauthenticated calls
 *      to `/v1/agents/:id/run` with 401 and accepts a freshly minted
 *      bearer token. Exercised via `server.app.request(...)` so the
 *      smoke test never binds a real port.
 */

import { createToken } from '@graphorin/security';
import {
  _resetResolversForTesting,
  installBuiltinResolvers,
  resolveSecret,
} from '@graphorin/security/secrets';
import { createSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import {
  type CreateSlackBotAppOptions,
  createSlackBotApp,
  processSlackEvent,
  type SlackBotApp,
  type SlackEventEnvelope,
  simulateApprovalLifecycle,
  VERSION,
} from '../src/main.js';
import { createInMemorySlackClient } from '../src/slack-stub.js';

const PEPPER_ENV_VAR = 'GRAPHORIN_SLACK_BOT_PEPPER_TEST';

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (cleanups.length > 0) {
    const fn = cleanups.pop();
    if (fn !== undefined) {
      try {
        await fn();
      } catch {
        // Best-effort.
      }
    }
  }
});

async function buildApp(overrides: CreateSlackBotAppOptions = {}): Promise<{
  readonly app: SlackBotApp;
  readonly slack: ReturnType<typeof createInMemorySlackClient>;
}> {
  const slack = createInMemorySlackClient();
  const app = await createSlackBotApp({
    recipe: 'stub',
    dbPath: ':memory:',
    slackClient: slack,
    ...overrides,
  });
  cleanups.push(() => app.close());
  return { app, slack };
}

describe('examples/slack-bot-integration — smoke', () => {
  it('exposes VERSION = 0.2.0', () => {
    expect(VERSION).toBe('0.2.0');
  });

  it('processSlackEvent forwards a small Slack message and posts the reply back', async () => {
    const { app, slack } = await buildApp({ sessionId: 'happy-path' });
    const event: SlackEventEnvelope = {
      type: 'event_callback',
      event: {
        type: 'message',
        user: 'U-PRIMARY',
        text: 'Hello, graphorin!',
        channel: 'C-bridge',
        ts: '1700000000.000010',
      },
    };
    const result = await processSlackEvent({ app, event, skipSignatureCheck: true });
    expect(result.status).toBe('ok');
    expect(result.assistantText).toBeDefined();
    expect(result.assistantText).toMatch(/Hello, graphorin!/);
    expect(slack.messages).toHaveLength(1);
    const [posted] = slack.messages;
    expect(posted?.channel).toBe('C-bridge');
    expect(posted?.text).toBe(result.assistantText);
    expect(posted?.thread_ts).toBe('1700000000.000010');
  });

  it('simulateApprovalLifecycle survives a simulated server restart and resumes the agent', async () => {
    const sharedStore = await createSqliteStore({
      path: ':memory:',
      disableWalHardening: true,
      skipSqliteVec: true,
    });
    await sharedStore.init();
    cleanups.push(async () => {
      try {
        await sharedStore.close();
      } catch {
        // The post-restart `app.close()` already closed it; swallow.
      }
    });
    const slack = createInMemorySlackClient();
    const app = await createSlackBotApp({
      recipe: 'stub',
      slackClient: slack,
      sessionId: 'approval-flow',
      store: sharedStore,
    });
    cleanups.push(() => app.close());

    const result = await simulateApprovalLifecycle({
      app,
      expense: { amount: 500, justification: 'engineering offsite travel' },
      decision: 'approve',
      reason: 'OK',
      restartFactory: async (oldApp) => {
        await oldApp.close();
        const slackAfter = createInMemorySlackClient();
        // Forward the messages already posted (so assertions below see
        // the full transcript across the simulated restart boundary).
        for (const m of slack.messages) {
          await slackAfter.postMessage({
            channel: m.channel,
            text: m.text,
            ...(m.thread_ts !== undefined ? { thread_ts: m.thread_ts } : {}),
            ...(m.buttons !== undefined ? { buttons: m.buttons } : {}),
            ...(m.metadata !== undefined ? { metadata: m.metadata } : {}),
          });
        }
        const next = await createSlackBotApp({
          recipe: 'stub',
          slackClient: slackAfter,
          sessionId: 'approval-flow',
          store: sharedStore,
        });
        cleanups.push(() => next.close());
        return next;
      },
    });

    expect(result.initial.status).toBe('awaiting_approval');
    expect(result.initial.runId).toBeDefined();
    expect(result.pendingBeforeRestart).toHaveLength(1);
    expect(result.pendingBeforeRestart[0]?.expense.amount).toBe(500);
    expect(result.pendingAfterRestart).toHaveLength(1);
    expect(result.pendingAfterRestart[0]?.runId).toBe(result.initial.runId);
    expect(result.resume.status).toBe('completed');
    expect(result.resume.assistantText).toBeDefined();
    expect(result.resume.assistantText).toMatch(/approved/i);

    // Slack transcript: 1 approval-needed message + 1 final reply.
    const approvalNeeded = result.slackMessages.find((m) => m.text.includes('Approval required'));
    expect(approvalNeeded).toBeDefined();
    expect(approvalNeeded?.buttons?.map((b) => b.value)).toEqual([
      `approve:${result.initial.runId}`,
      `deny:${result.initial.runId}`,
    ]);
    const finalMessage = result.slackMessages.find((m) =>
      m.text.includes('approved and submitted to finance'),
    );
    expect(finalMessage).toBeDefined();

    // The post-restart app cleared the routing row — listPendingApprovals
    // is now empty.
    const after = await result.resumedApp.listPendingApprovals();
    expect(after).toHaveLength(0);
  }, 15_000);

  it('rejects requests to /v1/agents/:id/run without a valid bearer token, accepts with one', async () => {
    _resetResolversForTesting();
    installBuiltinResolvers();
    process.env[PEPPER_ENV_VAR] = 'pepper-with-enough-entropy-token-test-32B';
    cleanups.push(async () => {
      delete process.env[PEPPER_ENV_VAR];
    });

    const sharedStore = await createSqliteStore({
      path: ':memory:',
      disableWalHardening: true,
      skipSqliteVec: true,
    });
    await sharedStore.init();
    cleanups.push(async () => {
      try {
        await sharedStore.close();
      } catch {
        // Best-effort.
      }
    });
    const { app } = await buildApp({
      sessionId: 'auth-flow',
      store: sharedStore,
      server: { auth: { enabled: true, pepperEnvVar: PEPPER_ENV_VAR } },
    });
    await app.server.start();

    const unauth = await app.server.app.request('/v1/agents/slack-bot/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'Hello' }),
    });
    expect(unauth.status).toBe(401);

    const pepper = await resolveSecret(`env:${PEPPER_ENV_VAR}`);
    const minted = await createToken({
      tokenStore: sharedStore.authTokens,
      pepper,
      env: 'live',
      scopes: ['agents:invoke'],
    });
    const raw = await minted.raw.use((value) => value);
    const authed = await app.server.app.request('/v1/agents/slack-bot/run', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${raw}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': 'token-test-key-1',
      },
      body: JSON.stringify({ input: 'Hello, graphorin!', sessionId: 'auth-flow' }),
    });
    expect(authed.status).toBe(200);
    const body = (await authed.json()) as { runId: string; status: string };
    expect(body.status).toBe('completed');
    expect(typeof body.runId).toBe('string');
  }, 20_000);
});
