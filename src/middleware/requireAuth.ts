// JWT (Bearer/cookie) ИЛИ X-API-Key — для защищённых API-маршрутов
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { hashApiKey } from '../utils/crypto.js';
import { findApiKeyByHash } from '../repositories/apiKey.repository.js';
import { findUserById } from '../repositories/user.repository.js';
import { AppError } from '../errors/AppError.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && typeof apiKey === 'string') {
    const record = findApiKeyByHash(hashApiKey(apiKey));
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
    return;
  }

  const header = req.headers.authorization;
  let token: string | undefined;
  if (header?.startsWith('Bearer ')) {
    token = header.slice(7);
  } else if (req.cookies?.token) {
    token = req.cookies.token as string;
  }

  if (!token) {
    next(new AppError(401, 'Требуется JWT или X-API-Key'));
    return;
  }

  try {
    req.user = verifyToken(token);
    req.authMethod = 'jwt';
    next();
  } catch {
    next(new AppError(401, 'Недействительный или просроченный токен'));
  }
}
