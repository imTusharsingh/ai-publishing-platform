import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { discoverMockTrends, seed } from '@repo/database';
import { prisma } from '@repo/database';
import { AppModule } from '../src/app.module';

describe('TopicsController (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  const runId = `e2e-${Date.now()}`;

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

  beforeAll(async () => {
    await seed();
    await discoverMockTrends(prisma, runId);

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

  it('GET /v1/topics returns discovered topics', async () => {
    const response = await request(app.getHttpServer()).get('/v1/topics').expect(200);

    expect(response.body.meta.total).toBeGreaterThanOrEqual(3);
    expect(response.body.data[0]).toMatchObject({
      title: expect.any(String),
      source: expect.any(String),
      status: expect.any(String),
    });
  });

  it('POST /v1/topics/discover enqueues a trend discovery job', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/topics/discover')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(response.body.jobId).toEqual(expect.any(String));
    expect(response.body.state).toMatch(/waiting|active|completed/);
  });

  it('PATCH /v1/topics/:id/status approves a topic', async () => {
    const topics = await request(app.getHttpServer()).get('/v1/topics?limit=1').expect(200);
    const topicId = topics.body.data[0].id;

    const response = await request(app.getHttpServer())
      .patch(`/v1/topics/${topicId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'APPROVED' })
      .expect(200);

    expect(response.body.status).toBe('APPROVED');
  });

  it('PATCH /v1/topics/:id edits title and description', async () => {
    const topics = await request(app.getHttpServer())
      .get('/v1/topics?status=APPROVED&limit=1')
      .expect(200);
    const topicId = topics.body.data[0].id;

    const response = await request(app.getHttpServer())
      .patch(`/v1/topics/${topicId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Edited topic title for e2e test',
        description: 'Updated editorial description',
      })
      .expect(200);

    expect(response.body.title).toBe('Edited topic title for e2e test');
    expect(response.body.description).toBe('Updated editorial description');
  });
});
