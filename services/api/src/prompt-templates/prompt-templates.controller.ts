import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePromptTemplateDto } from './dto/create-prompt-template.dto';
import { ListPromptTemplatesQueryDto } from './dto/list-prompt-templates-query.dto';
import { PromptCatalogQueryDto } from './dto/prompt-catalog-query.dto';
import { ResetPromptByKeyDto } from './dto/save-prompt-by-key.dto';
import { SavePromptByKeyDto } from './dto/save-prompt-by-key.dto';
import { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';
import { PromptTemplatesService } from './prompt-templates.service';

@Controller('admin/prompt-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
export class PromptTemplatesController {
  constructor(private readonly promptTemplatesService: PromptTemplatesService) {}

  @Get('catalog')
  catalog(@Query() query: PromptCatalogQueryDto) {
    return this.promptTemplatesService.catalog(query.categoryId ?? null);
  }

  @Get()
  async list(@Query() query: ListPromptTemplatesQueryDto) {
    return { data: await this.promptTemplatesService.list(query.key) };
  }

  @Get('defaults')
  listDefaults() {
    return { data: this.promptTemplatesService.listDefaults() };
  }

  @Get('defaults/:key')
  getDefault(@Param('key') key: string) {
    return this.promptTemplatesService.getDefault(key);
  }

  @Post('initialize')
  @Roles(UserRole.SUPER_ADMIN)
  initializeDefaults() {
    return this.promptTemplatesService.initializeDefaults();
  }

  @Put('by-key/:key')
  @Roles(UserRole.SUPER_ADMIN)
  saveByKey(@Param('key') key: string, @Body() dto: SavePromptByKeyDto) {
    return this.promptTemplatesService.saveByKey(key, dto.body, dto.categoryId ?? null);
  }

  @Post('by-key/:key/reset')
  @Roles(UserRole.SUPER_ADMIN)
  resetByKey(@Param('key') key: string, @Body() dto: ResetPromptByKeyDto) {
    return this.promptTemplatesService.resetByKey(key, dto.categoryId ?? null);
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.promptTemplatesService.findById(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreatePromptTemplateDto) {
    return this.promptTemplatesService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePromptTemplateDto) {
    return this.promptTemplatesService.update(id, dto);
  }

  @Post(':id/reset')
  @Roles(UserRole.SUPER_ADMIN)
  reset(@Param('id', ParseUUIDPipe) id: string) {
    return this.promptTemplatesService.reset(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.promptTemplatesService.remove(id);
  }
}
