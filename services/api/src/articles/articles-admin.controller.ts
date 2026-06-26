import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ArticlesAdminService } from './articles-admin.service';
import { ListAdminArticlesQueryDto } from './dto/list-admin-articles-query.dto';
import { UpdateArticleStatusDto } from './dto/update-article-status.dto';

@Controller('admin/articles')
export class ArticlesAdminController {
  constructor(private readonly articlesAdminService: ArticlesAdminService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  findAll(@Query() query: ListAdminArticlesQueryDto) {
    return this.articlesAdminService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.articlesAdminService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateArticleStatusDto) {
    return this.articlesAdminService.updateStatus(id, dto.status);
  }
}
