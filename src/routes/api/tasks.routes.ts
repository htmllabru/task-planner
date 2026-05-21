import { Router } from 'express';
import * as taskService from '../../services/task.service.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  taskStatusQuerySchema,
} from '../../validators/task.validator.js';

export const tasksApiRouter = Router();

tasksApiRouter.use(requireAuth);

tasksApiRouter.get('/', validate(taskStatusQuerySchema, 'query'), (req, res, next) => {
  try {
    const validated = (req as typeof req & { validated?: { query?: { status?: 'todo' | 'done' } } })
      .validated?.query;
    const status = validated?.status ?? (req.query.status as 'todo' | 'done' | undefined);
    const tasks = taskService.getTasks(req.user!.userId, status);
    res.json({ data: { tasks } });
  } catch (err) {
    next(err);
  }
});

tasksApiRouter.post('/', validate(createTaskSchema), (req, res, next) => {
  try {
    const { title, description, dueDate } = req.body as {
      title: string;
      description?: string | null;
      dueDate?: string | null;
    };
    const task = taskService.addTask(req.user!.userId, title, description, dueDate);
    res.status(201).json({ data: { task } });
  } catch (err) {
    next(err);
  }
});

tasksApiRouter.get('/:id', (req, res, next) => {
  try {
    const task = taskService.getTask(req.user!.userId, Number(req.params.id));
    res.json({ data: { task } });
  } catch (err) {
    next(err);
  }
});

tasksApiRouter.patch('/:id', validate(updateTaskSchema), (req, res, next) => {
  try {
    const body = req.body as {
      title?: string;
      description?: string | null;
      status?: 'todo' | 'done';
      dueDate?: string | null;
    };
    const task = taskService.patchTask(req.user!.userId, Number(req.params.id), body);
    res.json({ data: { task } });
  } catch (err) {
    next(err);
  }
});

tasksApiRouter.delete('/:id', (req, res, next) => {
  try {
    taskService.removeTask(req.user!.userId, Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
