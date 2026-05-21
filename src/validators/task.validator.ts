import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['todo', 'done']).optional(),
  dueDate: z.string().optional().nullable(),
});

export const taskStatusQuerySchema = z.object({
  status: z.enum(['todo', 'done']).optional(),
});
