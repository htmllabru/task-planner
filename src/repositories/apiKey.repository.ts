import { getDatabase } from '../db/database.js';
import type { ApiKeyRecord, ApiKeyPublic } from '../types/index.js';

export function createApiKey(
  userId: number,
  label: string,
  keyPrefix: string,
  keyHash: string,
): ApiKeyRecord {
  const db = getDatabase();
  const result = db
    .prepare(
      'INSERT INTO api_keys (user_id, label, key_prefix, key_hash) VALUES (?, ?, ?, ?)',
    )
    .run(userId, label, keyPrefix, keyHash);
  return findApiKeyById(Number(result.lastInsertRowid))!;
}

export function findApiKeyById(id: number): ApiKeyRecord | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id) as unknown as ApiKeyRecord | undefined;
}

export function findApiKeyByHash(keyHash: string): ApiKeyRecord | undefined {
  const db = getDatabase();
  return db
    .prepare('SELECT * FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL')
    .get(keyHash) as unknown as ApiKeyRecord | undefined;
}

export function listApiKeysByUser(userId: number): ApiKeyPublic[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      'SELECT id, label, key_prefix, created_at, revoked_at FROM api_keys WHERE user_id = ? ORDER BY id DESC',
    )
    .all(userId) as unknown as ApiKeyPublic[];
  return rows;
}

export function revokeApiKey(id: number, userId: number): boolean {
  const db = getDatabase();
  const result = db
    .prepare(
      `UPDATE api_keys SET revoked_at = datetime('now') WHERE id = ? AND user_id = ? AND revoked_at IS NULL`,
    )
    .run(id, userId);
  return result.changes > 0;
}
