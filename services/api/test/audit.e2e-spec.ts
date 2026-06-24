import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { seed } from '@repo/database';
import { AppModule } from '../src/app.module';

describe('AuditController (e2e)', () => {
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

  it('records audit log when category is created', async () => {
    const name = `Audit Test Category ${runId}`;

    await request(app.getHttpServer())
      .post('/v1/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name, description: 'Audit e2e' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/v1/audit-logs?entityType=category')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.meta.total).toBeGreaterThan(0);
    expect(response.body.data[0]).toMatchObject({
      action: expect.stringMatching(/^category\./),
      entityType: 'category',
      userEmail: adminEmail,
    });
  });
});
