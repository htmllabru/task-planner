import request from 'supertest';
import { getTestApp, teardownTestDb } from './helpers/testApp.js';

const app = getTestApp();

afterAll(() => {
  teardownTestDb();
});

describe('API Keys', () => {
  let token: string;
  let apiKey: string;

  beforeAll(async () => {
    const email = `key_${Date.now()}@test.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'pass1234' });
    token = res.body.data.token;
  });

  it('POST /api/auth/api-keys — выдаёт ключ один раз', async () => {
    const res = await request(app)
      .post('/api/auth/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'Test bot' })
      .expect(201);

    expect(res.body.data.key).toMatch(/^sk_/);
    apiKey = res.body.data.key;
  });

  it('GET /api/tasks — доступ по X-API-Key', async () => {
    await request(app)
      .get('/api/tasks')
      .set('X-API-Key', apiKey)
      .expect(200);
  });

  it('POST /api/tasks — создание по API-Key', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('X-API-Key', apiKey)
      .send({ title: 'Задача через API key' })
      .expect(201);

    expect(res.body.data.task.title).toBe('Задача через API key');
  });

  it('GET /api/tasks — неверный ключ → 401', async () => {
    await request(app)
      .get('/api/tasks')
      .set('X-API-Key', 'sk_invalid')
      .expect(401);
  });
});
