import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { generateMockArticle, prisma, seed } from '@repo/database';
import { AppModule } from '../src/app.module';

describe('Article generation (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let categoryId: string;
  const runId = `e2e-gen-${Date.now()}`;

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

    const categories = await request(app.getHttpServer())
      .get('/v1/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    categoryId = categories.body.data[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('generates draft article from approved idea', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/article-ideas')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        categoryId,
        title: `E2E generation idea ${runId}`,
        summary: 'Ready for writing',
      })
      .expect(201);

    const ideaId = created.body.id;

    await request(app.getHttpServer())
      .patch(`/v1/article-ideas/${ideaId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'APPROVED' })
      .expect(200);

    const enqueue = await request(app.getHttpServer())
      .post(`/v1/article-ideas/${ideaId}/generate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(enqueue.body.jobId).toEqual(expect.any(String));

    const generated = await generateMockArticle(prisma, ideaId);

    const adminArticle = await request(app.getHttpServer())
      .get(`/v1/admin/articles/${generated.articleId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(adminArticle.body).toMatchObject({
      status: 'DRAFT',
      title: `E2E generation idea ${runId}`,
      content: expect.stringContaining('<h1>'),
    });

    const published = await request(app.getHttpServer())
      .patch(`/v1/admin/articles/${generated.articleId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    expect(published.body.status).toBe('PUBLISHED');

    const publicList = await request(app.getHttpServer()).get('/v1/articles').expect(200);

    expect(
      publicList.body.data.some(
        (article: { title: string }) => article.title === `E2E generation idea ${runId}`,
      ),
    ).toBe(true);
  }, 15_000);
});
