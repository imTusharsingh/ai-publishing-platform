import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { seed } from '@repo/database';
import { AppModule } from '../src/app.module';

const redisAvailable = Boolean(process.env.REDIS_URL);

(redisAvailable ? describe : describe.skip)('JobsController (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

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

  it('POST /v1/jobs/ping enqueues a job', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/jobs/ping')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ message: 'integration ping' })
      .expect(201);

    expect(response.body.name).toBe('ping');
    expect(response.body.state).toMatch(/waiting|active|completed/);

    const status = await request(app.getHttpServer())
      .get(`/v1/jobs/${response.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(status.body.id).toBe(response.body.id);
  });
});
