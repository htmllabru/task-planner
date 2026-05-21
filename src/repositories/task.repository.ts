import { getDatabase } from '../db/database.js';
import type { Task, TaskStatus } from '../types/index.js';

export function listTasks(userId: number, status?: TaskStatus): Task[] {
  const db = getDatabase();
  if (status) {
    return db
      .prepare('SELECT * FROM tasks WHERE user_id = ? AND status = ? ORDER BY id DESC')
      .all(userId, status) as unknown as Task[];
  }
  return db
    .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC')
    .all(userId) as unknown as Task[];
}

export function findTaskById(id: number, userId: number): Task | undefined {
  const db = getDatabase();
  return db
    .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(id, userId) as unknown as Task | undefined;
}

export function createTask(
  userId: number,
  title: string,
  description: string | null,
  dueDate: string | null,
): Task {
  const db = getDatabase();
  const result = db
    .prepare(
      'INSERT INTO tasks (user_id, title, description, due_date) VALUES (?, ?, ?, ?)',
    )
    .run(userId, title, description, dueDate);
  return findTaskById(Number(result.lastInsertRowid), userId)!;
}

export function updateTask(
  id: number,
  userId: number,
  fields: Partial<Pick<Task, 'title' | 'description' | 'status' | 'due_date'>>,
): Task | undefined {
  const existing = findTaskById(id, userId);
  if (!existing) return undefined;

  const title = fields.title ?? existing.title;
  const description = fields.description !== undefined ? fields.description : existing.description;
  const status = fields.status ?? existing.status;
  const due_date = fields.due_date !== undefined ? fields.due_date : existing.due_date;

  const db = getDatabase();
  db.prepare(
    `UPDATE tasks SET title = ?, description = ?, status = ?, due_date = ?, updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`,
  ).run(title, description, status, due_date, id, userId);

  return findTaskById(id, userId);
}

export function deleteTask(id: number, userId: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, userId);
  return result.changes > 0;
}
