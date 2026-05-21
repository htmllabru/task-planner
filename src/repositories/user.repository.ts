import { getDatabase } from '../db/database.js';
import type { User, UserPublic } from '../types/index.js';

export function findUserByEmail(email: string): User | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as User | undefined;
}

export function findUserById(id: number): User | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as User | undefined;
}

export function createUser(email: string, passwordHash: string): UserPublic {
  const db = getDatabase();
  const result = db
    .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    .run(email, passwordHash);
  const id = Number(result.lastInsertRowid);
  const user = findUserById(id)!;
  return toPublic(user);
}

export function toPublic(user: User): UserPublic {
  return { id: user.id, email: user.email, created_at: user.created_at };
}
