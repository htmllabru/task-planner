// CRUD задач — только в рамках userId владельца
import {
  listTasks,
  findTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../repositories/task.repository.js';
import { AppError } from '../errors/AppError.js';
import type { Task, TaskStatus } from '../types/index.js';

export function getTasks(userId: number, status?: TaskStatus): Task[] {
  return listTasks(userId, status);
}

export function getTask(userId: number, taskId: number): Task {
  const task = findTaskById(taskId, userId);
  if (!task) {
    throw new AppError(404, 'Задача не найдена');
  }
  return task;
}

export function addTask(
  userId: number,
  title: string,
  description?: string | null,
  dueDate?: string | null,
): Task {
  return createTask(userId, title, description ?? null, dueDate ?? null);
}

export function patchTask(
  userId: number,
  taskId: number,
  data: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    dueDate?: string | null;
  },
): Task {
  const updated = updateTask(taskId, userId, {
    title: data.title,
    description: data.description,
    status: data.status,
    due_date: data.dueDate,
  });
  if (!updated) {
    throw new AppError(404, 'Задача не найдена');
  }
  return updated;
}

export function removeTask(userId: number, taskId: number): void {
  const ok = deleteTask(taskId, userId);
  if (!ok) {
    throw new AppError(404, 'Задача не найдена');
  }
}
