// Express-приложение: API JSON + веб-интерфейс EJS
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { apiRouter } from './routes/api/index.js';
import { webRouter } from './routes/web/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(): Express {
  const app = express();

  app.set('view engine', 'ejs');
  // после tsc шаблоны остаются в src/views
  const viewsLocal = path.join(__dirname, 'views');
  app.set(
    'views',
    existsSync(viewsLocal) ? viewsLocal : path.join(__dirname, '..', 'src', 'views'),
  );

  // Обёртка layout: рендер страницы → вставка в layouts/main.ejs
  app.use((req: Request, res: Response, next: NextFunction) => {
    const originalRender = res.render.bind(res);
    res.render = function renderWithLayout(
      view: string,
      options?: object,
      callback?: (err: Error, html: string) => void,
    ): void {
      originalRender(view, options ?? {}, (err, html) => {
        if (err) {
          if (callback) callback(err, '');
          else next(err);
          return;
        }
        originalRender(
          'layouts/main',
          { ...(options as object), body: html },
          callback as (err: Error, html: string) => void,
        );
      });
    } as typeof res.render;
    next();
  });

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use('/api', apiRouter);
  app.use(webRouter);

  app.use(errorHandler);

  return app;
}
