// Хелпер тестов: in-memory SQLite + Supertest agent
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-min-32-chars-long';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.DATABASE_PATH = ':memory:';
process.env.NODE_ENV = 'test';

import { initDatabase, migrateDatabase, closeDatabase } from '../../src/db/database.js';
import { createApp } from '../../src/app.js';
import type { Express } from 'express';

let app: Express;

export function setupTestDb(): void {
  initDatabase(':memory:');
  migrateDatabase();
}

export function getTestApp(): Express {
  if (!app) {
    setupTestDb();
    app = createApp();
  }
  return app;
}

export function teardownTestDb(): void {
  closeDatabase();
  app = undefined as unknown as Express;
}
