import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      // Express 5: query/params только для чтения — body можно заменить
      if (source === 'body') {
        req.body = parsed;
      } else {
        (req as Request & { validated: Record<string, unknown> }).validated = {
          ...(req as Request & { validated?: Record<string, unknown> }).validated,
          [source]: parsed,
        };
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next({ statusCode: 400, message: 'Ошибка валидации', details: err.flatten() });
        return;
      }
      next(err);
    }
  };
}
