// Выдача и отзыв API-ключей (полный ключ показывается один раз)
import {
  createApiKey,
  listApiKeysByUser,
  revokeApiKey,
} from '../repositories/apiKey.repository.js';
import { generateApiKey, hashApiKey } from '../utils/crypto.js';
import { AppError } from '../errors/AppError.js';
import type { ApiKeyPublic } from '../types/index.js';

export function listKeys(userId: number): ApiKeyPublic[] {
  return listApiKeysByUser(userId);
}

export function createKey(
  userId: number,
  label: string,
): { key: string; prefix: string; id: number } {
  const key = generateApiKey();
  const prefix = key.slice(0, 11);
  const record = createApiKey(userId, label, prefix, hashApiKey(key));
  return { key, prefix, id: record.id };
}

export function revokeKey(userId: number, keyId: number): void {
  const ok = revokeApiKey(keyId, userId);
  if (!ok) {
    throw new AppError(404, 'Ключ не найден или уже отозван');
  }
}
