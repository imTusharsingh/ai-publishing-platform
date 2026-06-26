import { Module } from '@nestjs/common';
import { ArticleIdeasController } from './article-ideas.controller';
import { ArticleIdeasService } from './article-ideas.service';

@Module({
  controllers: [ArticleIdeasController],
  providers: [ArticleIdeasService],
  exports: [ArticleIdeasService],
})
export class ArticleIdeasModule {}
