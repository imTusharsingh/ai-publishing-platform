import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { seed } from '@repo/database';
import { AppModule } from '../src/app.module';

describe('CategoriesController (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  const runId = Date.now();

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

  beforeAll(async () => {
    await seed();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    accessToken = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/categories returns seeded categories', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/categories?activeOnly=true')
      .expect(200);

    expect(response.body.meta.total).toBeGreaterThanOrEqual(7);
    expect(response.body.data[0]).toMatchObject({
      name: expect.any(String),
      slug: expect.any(String),
      isActive: true,
    });
  });

  it('GET /v1/categories/:slug returns a category with article count', async () => {
    const response = await request(app.getHttpServer()).get('/v1/categories/startups').expect(200);

    expect(response.body.slug).toBe('startups');
    expect(response.body.articleCount).toBe(0);
  });

  it('POST /v1/categories creates a category for admins', async () => {
    const name = `Sprint 3 Test Category ${runId}`;
    const response = await request(app.getHttpServer())
      .post('/v1/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name,
        description: 'Created in e2e',
        keywords: ['test'],
        priorityScore: 42,
      })
      .expect(201);

    expect(response.body.name).toBe(name);
    expect(response.body.priorityScore).toBe(42);
  });

  it('POST /v1/categories rejects unauthenticated requests', async () => {
    await request(app.getHttpServer())
      .post('/v1/categories')
      .send({ name: 'Unauthorized Category' })
      .expect(401);
  });

  it('PUT /v1/categories/:id updates a category', async () => {
    const name = `Update Target Category ${runId}`;
    const created = await request(app.getHttpServer())
      .post('/v1/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name })
      .expect(201);

    const response = await request(app.getHttpServer())
      .put(`/v1/categories/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ description: 'Updated description', priorityScore: 88 })
      .expect(200);

    expect(response.body.description).toBe('Updated description');
    expect(response.body.priorityScore).toBe(88);
  });

  it('DELETE /v1/categories/:id hard-deletes empty categories', async () => {
    const name = `Delete Target Category ${runId}`;
    const created = await request(app.getHttpServer())
      .post('/v1/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/v1/categories/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer()).get(`/v1/categories/${created.body.slug}`).expect(404);
  });
});
