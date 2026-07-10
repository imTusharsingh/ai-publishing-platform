import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { TopicStatus } from '@prisma/client';
import { discoverTrends, prisma, seed } from '@repo/database';
import { AppModule } from '../src/app.module';

describe('ArticleIdeasController (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let categoryId: string;
  let topicId: string;
  const runId = `e2e-ideas-${Date.now()}`;

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

  beforeAll(async () => {
    await seed();
    await discoverTrends(prisma, runId);

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

    const topic = await prisma.trendingTopic.create({
      data: {
        title: `E2E idea topic ${runId}`,
        description: 'Unique topic for idea generation e2e',
        source: 'BLOG_RSS',
        popularityScore: 88,
        status: TopicStatus.APPROVED,
        matchedCategoryId: categoryId,
        normalizedTitle: `e2e-idea-topic-${runId}`,
      },
    });
    topicId = topic.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/article-ideas returns seeded ideas', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/article-ideas')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.meta.total).toBeGreaterThanOrEqual(1);
    expect(response.body.data[0]).toMatchObject({
      title: expect.any(String),
      slugCandidate: expect.any(String),
      status: expect.any(String),
    });
  });

  it('POST /v1/article-ideas creates a draft idea', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/article-ideas')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        categoryId,
        title: `E2E manual idea ${runId}`,
        summary: 'Created by e2e test',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      title: `E2E manual idea ${runId}`,
      status: 'DRAFT',
      categoryId,
    });
  });

  it('POST /v1/article-ideas/from-topic/:topicId generates mock idea', async () => {
    const response = await request(app.getHttpServer())
      .post(`/v1/article-ideas/from-topic/${topicId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(response.body).toMatchObject({
      trendingTopicId: topicId,
      status: 'DRAFT',
      outline: expect.arrayContaining([
        expect.objectContaining({ heading: expect.any(String), points: expect.any(Array) }),
      ]),
    });
  });

  it('PATCH /v1/article-ideas/:id/status approves an idea', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/article-ideas')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        categoryId,
        title: `E2E approve idea ${runId}`,
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .patch(`/v1/article-ideas/${created.body.id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'APPROVED' })
      .expect(200);

    expect(response.body.status).toBe('APPROVED');
  });
});
