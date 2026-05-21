import { Router } from 'express';
import { register, login } from '../../services/auth.service.js';
import * as apiKeyService from '../../services/apiKey.service.js';
import * as taskService from '../../services/task.service.js';
import { webAuth, webGuest } from '../../middleware/webAuth.js';
import { env } from '../../config/env.js';
import type { TaskStatus } from '../../types/index.js';
import { AppError } from '../../errors/AppError.js';

export const webRouter = Router();

webRouter.get('/', (_req, res) => {
  res.redirect('/login');
});

webRouter.get('/register', webGuest, (_req, res) => {
  res.render('auth/register', { title: 'Регистрация', error: null });
});

webRouter.post('/register', webGuest, async (req, res) => {
  try {
    const email = String(req.body.email ?? '').trim();
    const password = String(req.body.password ?? '');
    if (!email || password.length < 6) {
      res.status(400).render('auth/register', {
        title: 'Регистрация',
        error: 'Email и пароль (мин. 6 символов) обязательны',
      });
      return;
    }
    const { token } = await register(email, password);
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.cookieSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect('/cabinet');
  } catch (err) {
    const status = err instanceof AppError ? err.statusCode : 400;
    const message = err instanceof Error ? err.message : 'Ошибка регистрации';
    res.status(status).render('auth/register', { title: 'Регистрация', error: message });
  }
});

webRouter.get('/login', webGuest, (_req, res) => {
  res.render('auth/login', { title: 'Вход', error: null });
});

webRouter.post('/login', webGuest, async (req, res) => {
  try {
    const email = String(req.body.email ?? '').trim();
    const password = String(req.body.password ?? '');
    const { token } = await login(email, password);
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.cookieSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect('/cabinet');
  } catch {
    res.status(401).render('auth/login', {
      title: 'Вход',
      error: 'Неверный email или пароль',
    });
  }
});

webRouter.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

webRouter.get('/cabinet', webAuth, (req, res) => {
  const keys = apiKeyService.listKeys(req.user!.userId);
  const newKey = req.query.newKey as string | undefined;
  res.render('cabinet/index', {
    title: 'Личный кабинет',
    email: req.user!.email,
    keys,
    newKey: newKey ?? null,
    success: req.query.success ?? null,
  });
});

webRouter.post('/cabinet/api-keys', webAuth, (req, res) => {
  const label = String(req.body.label ?? 'Default').trim() || 'Default';
  const created = apiKeyService.createKey(req.user!.userId, label);
  res.redirect(`/cabinet?newKey=${encodeURIComponent(created.key)}&success=created`);
});

webRouter.post('/cabinet/api-keys/:id/revoke', webAuth, (req, res) => {
  try {
    apiKeyService.revokeKey(req.user!.userId, Number(req.params.id));
    res.redirect('/cabinet?success=revoked');
  } catch {
    res.redirect('/cabinet?success=error');
  }
});

webRouter.get('/tasks', webAuth, (req, res) => {
  const status = req.query.status as TaskStatus | undefined;
  const tasks = taskService.getTasks(req.user!.userId, status);
  res.render('tasks/list', {
    title: 'Задачи',
    email: req.user!.email,
    tasks,
    filter: status ?? 'all',
  });
});

webRouter.post('/tasks', webAuth, (req, res) => {
  const title = String(req.body.title ?? '').trim();
  const description = String(req.body.description ?? '').trim() || null;
  const dueDate = String(req.body.dueDate ?? '').trim() || null;
  if (title) {
    taskService.addTask(req.user!.userId, title, description, dueDate);
  }
  res.redirect('/tasks');
});

webRouter.post('/tasks/:id/edit', webAuth, (req, res) => {
  const id = Number(req.params.id);
  const title = String(req.body.title ?? '').trim();
  const description = String(req.body.description ?? '').trim() || null;
  const status = (req.body.status as TaskStatus) ?? 'todo';
  const dueDate = String(req.body.dueDate ?? '').trim() || null;
  if (title) {
    taskService.patchTask(req.user!.userId, id, { title, description, status, dueDate });
  }
  res.redirect('/tasks');
});

webRouter.post('/tasks/:id/delete', webAuth, (req, res) => {
  try {
    taskService.removeTask(req.user!.userId, Number(req.params.id));
  } catch {
    // ignore for MVP
  }
  res.redirect('/tasks');
});
