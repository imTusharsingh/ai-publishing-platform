import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { seed } from '@repo/database';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/auth/login returns tokens for valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.tokenType).toBe('Bearer');
    expect(response.body.user.email).toBe(adminEmail);
    expect(response.body.user.role).toBe('SUPER_ADMIN');
  });

  it('POST /v1/auth/login rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: 'wrong-password' })
      .expect(401);
  });

  it('POST /v1/auth/refresh issues new tokens', async () => {
    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.refreshToken).not.toBe(login.body.refreshToken);
  });

  it('POST /v1/auth/logout revokes refresh token', async () => {
    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    await request(app.getHttpServer())
      .post('/v1/auth/logout')
      .send({ refreshToken: login.body.refreshToken })
      .expect(204);

    await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(401);
  });

  it('GET /v1/auth/me returns current user with valid access token', async () => {
    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);

    expect(response.body.user.email).toBe(adminEmail);
    expect(response.body.user.role).toBe('SUPER_ADMIN');
  });

  it('GET /v1/auth/me rejects missing token', async () => {
    await request(app.getHttpServer()).get('/v1/auth/me').expect(401);
  });
});
