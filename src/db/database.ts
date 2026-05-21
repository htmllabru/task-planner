// Подключение к SQLite через встроенный модуль Node.js (node:sqlite)
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function initDatabase(dbPath: string): DatabaseSync {
  if (dbPath !== ':memory:') {
    mkdirSync(dirname(dbPath), { recursive: true });
  }
  db = new DatabaseSync(dbPath);
  return db;
}

function resolveSchemaPath(): string {
  const local = join(__dirname, 'schema.sql');
  if (existsSync(local)) return local;
  // после tsc schema.sql лежит в src/db — поднимаемся из dist/db
  return join(__dirname, '..', '..', 'src', 'db', 'schema.sql');
}

export function migrateDatabase(): void {
  const database = getDatabase();
  const schema = readFileSync(resolveSchemaPath(), 'utf8');
  database.exec(schema);
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
