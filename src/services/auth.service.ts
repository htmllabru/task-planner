// Регистрация, вход, профиль пользователя
import bcrypt from 'bcrypt';
import {
  createUser,
  findUserByEmail,
  findUserById,
  toPublic,
} from '../repositories/user.repository.js';
import { signToken } from '../utils/jwt.js';
import { AppError } from '../errors/AppError.js';
import type { UserPublic } from '../types/index.js';

const BCRYPT_ROUNDS = 10;

export async function register(
  email: string,
  password: string,
): Promise<{ user: UserPublic; token: string }> {
  const existing = findUserByEmail(email);
  if (existing) {
    throw new AppError(409, 'Пользователь с таким email уже существует');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = createUser(email.toLowerCase(), passwordHash);
  const token = signToken({ userId: user.id, email: user.email });
  return { user, token };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: UserPublic; token: string }> {
  const user = findUserByEmail(email.toLowerCase());
  if (!user) {
    throw new AppError(401, 'Неверный email или пароль');
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw new AppError(401, 'Неверный email или пароль');
  }

  const publicUser = toPublic(user);
  const token = signToken({ userId: user.id, email: user.email });
  return { user: publicUser, token };
}

export function getMe(userId: number): UserPublic {
  const user = findUserById(userId);
  if (!user) {
    throw new AppError(404, 'Пользователь не найден');
  }
  return toPublic(user);
}
