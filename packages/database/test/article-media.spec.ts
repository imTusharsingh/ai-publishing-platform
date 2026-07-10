import {
  buildArticleMediaPublicUrl,
  buildArticleMediaStorageKey,
  buildFeaturedImagePublicPath,
  buildInlineImagePublicPath,
} from '../src/article-media';

describe('article-media', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ARTICLE_MEDIA_S3_BUCKET;
    delete process.env.ARTICLE_MEDIA_S3_PREFIX;
    delete process.env.ARTICLE_MEDIA_PUBLIC_BASE_URL;
    delete process.env.AWS_REGION;
    delete process.env.AWS_DEFAULT_REGION;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('builds local public paths by default', () => {
    expect(buildFeaturedImagePublicPath('demo', 'svg')).toBe('/media/articles/demo.svg');
    expect(buildInlineImagePublicPath('demo', 1, 'png')).toBe('/media/articles/demo-inline-1.png');
    expect(buildArticleMediaPublicUrl('demo.svg')).toBe('/media/articles/demo.svg');
  });

  it('builds S3 keys with normalized prefixes', () => {
    expect(buildArticleMediaStorageKey('demo.svg', '/custom/prefix/')).toBe(
      'custom/prefix/demo.svg',
    );
  });

  it('builds S3 public urls when bucket is configured', () => {
    process.env.ARTICLE_MEDIA_S3_BUCKET = 'assets-bucket';
    process.env.AWS_REGION = 'ap-south-1';
    process.env.ARTICLE_MEDIA_S3_PREFIX = 'media/articles';

    expect(buildArticleMediaPublicUrl('demo.svg')).toBe(
      'https://assets-bucket.s3.ap-south-1.amazonaws.com/media/articles/demo.svg',
    );
  });

  it('uses custom public base url for CDN fronted buckets', () => {
    process.env.ARTICLE_MEDIA_S3_BUCKET = 'assets-bucket';
    process.env.ARTICLE_MEDIA_PUBLIC_BASE_URL = 'https://cdn.example.com/';

    expect(buildArticleMediaPublicUrl('demo.svg')).toBe(
      'https://cdn.example.com/media/articles/demo.svg',
    );
  });
});
