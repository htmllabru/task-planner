export type TaskStatus = 'todo' | 'done';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface UserPublic {
  id: number;
  email: string;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKeyRecord {
  id: number;
  user_id: number;
  label: string;
  key_prefix: string;
  key_hash: string;
  created_at: string;
  revoked_at: string | null;
}

export interface ApiKeyPublic {
  id: number;
  label: string;
  key_prefix: string;
  created_at: string;
  revoked_at: string | null;
}

export interface AuthPayload {
  userId: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      authMethod?: 'jwt' | 'apiKey';
    }
  }
}
