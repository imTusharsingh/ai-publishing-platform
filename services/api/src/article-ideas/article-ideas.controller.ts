import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ArticleIdeasService } from './article-ideas.service';
import { CreateArticleIdeaDto } from './dto/create-article-idea.dto';
import { ListArticleIdeasQueryDto } from './dto/list-article-ideas-query.dto';
import { UpdateArticleIdeaStatusDto } from './dto/update-article-idea-status.dto';

@Controller('article-ideas')
export class ArticleIdeasController {
  constructor(private readonly articleIdeasService: ArticleIdeasService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  findAll(@Query() query: ListArticleIdeasQueryDto) {
    return this.articleIdeasService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.articleIdeasService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  create(@Body() dto: CreateArticleIdeaDto) {
    return this.articleIdeasService.create(dto);
  }

  @Post('from-topic/:topicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  createFromTopic(@Param('topicId', ParseUUIDPipe) topicId: string) {
    return this.articleIdeasService.createFromTopic(topicId);
  }

  @Post(':id/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  generate(@Param('id', ParseUUIDPipe) id: string) {
    return this.articleIdeasService.enqueueGenerate(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateArticleIdeaStatusDto) {
    return this.articleIdeasService.updateStatus(id, dto.status);
  }
}
