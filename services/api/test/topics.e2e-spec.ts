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
      status: 'DISCOVERED',
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
});
