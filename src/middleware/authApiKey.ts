// Проверка серверного API-ключа из заголовка X-API-Key
import type { Request, Response, NextFunction } from 'express';
import { hashApiKey } from '../utils/crypto.js';
import { findApiKeyByHash } from '../repositories/apiKey.repository.js';
import { findUserById } from '../repositories/user.repository.js';
import { AppError } from '../errors/AppError.js';

export function authApiKey(req: Request, _res: Response, next: NextFunction): void {
  const key = req.headers['x-api-key'];
  if (!key || typeof key !== 'string') {
    next(new AppError(401, 'Требуется заголовок X-API-Key'));
    return;
  }

  const record = findApiKeyByHash(hashApiKey(key));
  if (!record) {
    next(new AppError(401, 'Недействительный API-ключ'));
    return;
  }

  const user = findUserById(record.user_id);
  if (!user) {
    next(new AppError(401, 'Пользователь не найден'));
    return;
  }

  req.user = { userId: user.id, email: user.email };
  req.authMethod = 'apiKey';
  next();
}
