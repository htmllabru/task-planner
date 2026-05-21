import request from 'supertest';
import { getTestApp, teardownTestDb } from './helpers/testApp.js';

const app = getTestApp();

afterAll(() => {
  teardownTestDb();
});

describe('Tasks API', () => {
  let tokenA: string;
  let tokenB: string;
  let taskId: number;

  beforeAll(async () => {
    const emailA = `a_${Date.now()}@test.com`;
    const emailB = `b_${Date.now()}@test.com`;
    const resA = await request(app)
      .post('/api/auth/register')
      .send({ email: emailA, password: 'pass1234' });
    const resB = await request(app)
      .post('/api/auth/register')
      .send({ email: emailB, password: 'pass1234' });
    tokenA = resA.body.data.token;
    tokenB = resB.body.data.token;
  });

  it('GET /api/tasks — без auth → 401', async () => {
    await request(app).get('/api/tasks').expect(401);
  });

  it('POST /api/tasks — создаёт задачу', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Первая задача', description: 'Тест' })
      .expect(201);

    expect(res.body.data.task.title).toBe('Первая задача');
    taskId = res.body.data.task.id;
  });

  it('GET /api/tasks — список задач пользователя A', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/tasks/:id — пользователь B не видит чужую задачу', async () => {
    await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('PATCH /api/tasks/:id — обновление статуса', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'done' })
      .expect(200);

    expect(res.body.data.task.status).toBe('done');
  });

  it('DELETE /api/tasks/:id', async () => {
    await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(204);
  });
});
