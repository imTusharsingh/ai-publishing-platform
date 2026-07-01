import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ArticleIdeasModule } from './article-ideas/article-ideas.module';
import { TopicsModule } from './topics/topics.module';
import { JobsModule } from './jobs/jobs.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { CategoriesModule } from './categories/categories.module';
import { SettingsModule } from './settings/settings.module';
import { DuplicateRejectionsModule } from './duplicate-rejections/duplicate-rejections.module';
import { PublishingModule } from './publishing/publishing.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    AuditModule,
    JobsModule,
    TopicsModule,
    ArticleIdeasModule,
    CategoriesModule,
    ArticlesModule,
    DuplicateRejectionsModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
