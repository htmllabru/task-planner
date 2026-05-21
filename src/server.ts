// Точка входа: инициализация БД и HTTP-сервер
import { createApp } from './app.js';
import { env } from './config/env.js';
import { initDatabase, migrateDatabase, closeDatabase } from './db/database.js';

const migrateOnly = process.argv.includes('--migrate-only');

initDatabase(env.databasePath);
migrateDatabase();

if (migrateOnly) {
  console.log('Migrations applied.');
  closeDatabase();
  process.exit(0);
}

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`Task Planner: http://localhost:${env.port}`);
});

process.on('SIGINT', () => {
  server.close();
  closeDatabase();
  process.exit(0);
});
