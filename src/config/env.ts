// Загрузка и валидация переменных окружения
import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientOrigin,
  databasePath: process.env.DATABASE_PATH ?? './data/app.db',
  isProduction: process.env.NODE_ENV === 'production',
  /** Secure cookie только по HTTPS; при http://IP иначе браузер не сохраняет token */
  cookieSecure:
    process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' && clientOrigin.startsWith('https://')),
};
