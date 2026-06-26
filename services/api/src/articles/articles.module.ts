import { Module } from '@nestjs/common';
import { ArticlesAdminController } from './articles-admin.controller';
import { ArticlesAdminService } from './articles-admin.service';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';

@Module({
  controllers: [ArticlesController, ArticlesAdminController],
  providers: [ArticlesService, ArticlesAdminService],
  exports: [ArticlesService, ArticlesAdminService],
})
export class ArticlesModule {}
