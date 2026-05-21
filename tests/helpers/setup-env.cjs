// Запускается Jest до импорта тестов (в CI нет файла .env)
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'test-jwt-secret-min-32-chars-long-for-ci';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
process.env.DATABASE_PATH = process.env.DATABASE_PATH ?? ':memory:';
process.env.NODE_ENV = 'test';
