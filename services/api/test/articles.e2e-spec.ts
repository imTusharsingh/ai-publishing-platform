import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { seed } from '@repo/database';
import { AppModule } from '../src/app.module';

describe('ArticlesController (e2e)', () => {
  let app: INestApplication<App>;

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

  it('GET /v1/articles returns published articles', async () => {
    const response = await request(app.getHttpServer()).get('/v1/articles').expect(200);

    expect(response.body.meta.total).toBeGreaterThanOrEqual(6);
    expect(response.body.data[0]).toMatchObject({
      title: expect.any(String),
      slug: expect.any(String),
      category: {
        name: expect.any(String),
        slug: expect.any(String),
      },
    });
  });

  it('GET /v1/articles?category=startups filters by category', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/articles?category=startups')
      .expect(200);

    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      response.body.data.every(
        (item: { category: { slug: string } }) => item.category.slug === 'startups',
      ),
    ).toBe(true);
  });

  it('GET /v1/articles?page=1&limit=2 paginates results', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/articles?page=1&limit=2')
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta.limit).toBe(2);
    expect(response.body.meta.page).toBe(1);
  });
});
