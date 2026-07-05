/**
 * W-011 fixture: appends N audit entries from a separate thread. Each
 * worker has its own connection, its own event loop and its own
 * in-process write chain - the closest in-repo emulation of a second
 * server PROCESS contending on one audit.db file (better-sqlite3 blocks
 * synchronously on the write lock, which would deadlock two handles on
 * ONE thread but is exactly how two processes wait for each other).
 */

import { parentPort, workerData } from 'node:worker_threads';
import { resolveSecret } from '@graphorin/security';
import { appendAudit, openAuditDb } from '@graphorin/security/audit';
import { ensureStoreAuditBinding } from '@graphorin/server';

const { path, n, tag, passEnvVar } = workerData;
ensureStoreAuditBinding();
const passphrase = await resolveSecret(`env:${passEnvVar}`);
const db = await openAuditDb({ path, passphrase });
for (let i = 0; i < n; i += 1) {
  await appendAudit(db, {
    actor: { kind: 'system', id: tag },
    action: 'secrets:read',
    target: `${tag}:${i}`,
    decision: 'success',
  });
}
await db.close();
parentPort?.postMessage('done');
