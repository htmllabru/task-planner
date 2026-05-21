import request from 'supertest';
import { getTestApp, teardownTestDb } from './helpers/testApp.js';

const app = getTestApp();

afterAll(() => {
  teardownTestDb();
});

describe('Auth API', () => {
  const email = `user_${Date.now()}@test.com`;
  const password = 'secret123';
  let token: string;

  it('POST /api/auth/register — создаёт пользователя', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);

    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(email.toLowerCase());
    token = res.body.data.token;
  });

  it('POST /api/auth/register — дубликат email → 409', async () => {
    await request(app).post('/api/auth/register').send({ email, password }).expect(409);
  });

  it('POST /api/auth/login — возвращает JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  it('GET /api/auth/me — без токена → 401', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  it('GET /api/auth/me — с Bearer → 200', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.user.email).toBe(email.toLowerCase());
  });
});
