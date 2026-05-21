import { Router } from 'express';
import { register, login, getMe } from '../../services/auth.service.js';
import * as apiKeyService from '../../services/apiKey.service.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, createApiKeySchema } from '../../validators/auth.validator.js';
import { authJwt } from '../../middleware/authJwt.js';

export const authApiRouter = Router();

authApiRouter.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const result = await register(email, password);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

authApiRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const result = await login(email, password);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

authApiRouter.get('/me', authJwt, (req, res, next) => {
  try {
    const user = getMe(req.user!.userId);
    res.json({ data: { user } });
  } catch (err) {
    next(err);
  }
});

authApiRouter.get('/api-keys', authJwt, (req, res, next) => {
  try {
    const keys = apiKeyService.listKeys(req.user!.userId);
    res.json({ data: { keys } });
  } catch (err) {
    next(err);
  }
});

authApiRouter.post('/api-keys', authJwt, validate(createApiKeySchema), (req, res, next) => {
  try {
    const { label } = req.body as { label: string };
    const created = apiKeyService.createKey(req.user!.userId, label);
    res.status(201).json({
      data: created,
      warning: 'Сохраните ключ сейчас — повторно он не будет показан',
    });
  } catch (err) {
    next(err);
  }
});

authApiRouter.delete('/api-keys/:id', authJwt, (req, res, next) => {
  try {
    const id = Number(req.params.id);
    apiKeyService.revokeKey(req.user!.userId, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
