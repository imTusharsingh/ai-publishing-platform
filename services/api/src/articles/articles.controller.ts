import { Controller, Get, Param, Query } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';
import { SearchArticlesQueryDto } from './dto/search-articles-query.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  findAll(@Query() query: ListArticlesQueryDto) {
    return this.articlesService.findAll(query);
  }

  @Get('search')
  search(@Query() query: SearchArticlesQueryDto) {
    return this.articlesService.search(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }
}
