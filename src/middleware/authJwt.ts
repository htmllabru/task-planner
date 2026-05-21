// Проверка JWT из Authorization: Bearer или cookie token
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../errors/AppError.js';

export function authJwt(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  let token: string | undefined;

  if (header?.startsWith('Bearer ')) {
    token = header.slice(7);
  } else if (req.cookies?.token) {
    token = req.cookies.token as string;
  }

  if (!token) {
    next(new AppError(401, 'Требуется авторизация'));
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
