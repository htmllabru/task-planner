import { Router } from 'express';
import { authApiRouter } from './auth.routes.js';
import { tasksApiRouter } from './tasks.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authApiRouter);
apiRouter.use('/tasks', tasksApiRouter);
