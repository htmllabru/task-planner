import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: { message: 'Ошибка валидации', details: err.flatten() },
    });
    return;
  }

  const withStatus = err as { statusCode?: number; message?: string; details?: unknown };
  if (withStatus.statusCode) {
    res.status(withStatus.statusCode).json({
      error: { message: withStatus.message ?? 'Error', details: withStatus.details },
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Внутренняя ошибка сервера' } });
}
