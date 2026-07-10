import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DEFAULT_PROMPT_DEFINITIONS,
  deletePromptTemplate,
  ensureDefaultPromptTemplates,
  getDefaultPromptDefinition,
  getPromptCatalog,
  getPromptTemplateById,
  listPromptTemplates,
  resetPromptByKey,
  resetPromptTemplateToDefault,
  savePromptByKey,
  updatePromptTemplate,
  upsertPromptTemplate,
} from '@repo/database';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromptTemplateDto } from './dto/create-prompt-template.dto';
import { UpdatePromptTemplateDto } from './dto/update-prompt-template.dto';

@Injectable()
export class PromptTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  catalog(categoryId?: string | null) {
    return getPromptCatalog(this.prisma, categoryId ?? null);
  }

  list(key?: string) {
    return listPromptTemplates(this.prisma, key);
  }

  async findById(id: string) {
    const template = await getPromptTemplateById(this.prisma, id);
    if (!template) {
      throw new NotFoundException(`Prompt template with id "${id}" not found`);
    }
    return template;
  }

  listDefaults() {
    return Object.values(DEFAULT_PROMPT_DEFINITIONS).map((definition) => ({
      key: definition.key,
      name: definition.name,
      description: definition.description,
      body: definition.body,
      variables: definition.variables,
    }));
  }

  getDefault(key: string) {
    const definition = getDefaultPromptDefinition(key);
    if (!definition) {
      throw new NotFoundException(`No built-in default for prompt key "${key}"`);
    }
    return definition;
  }

  async initializeDefaults() {
    await ensureDefaultPromptTemplates(this.prisma);
    return this.catalog();
  }

  async saveByKey(key: string, body: string, categoryId?: string | null) {
    try {
      return await savePromptByKey(this.prisma, key, body, categoryId ?? null);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to save prompt template',
      );
    }
  }

  async resetByKey(key: string, categoryId?: string | null) {
    try {
      const result = await resetPromptByKey(this.prisma, key, categoryId ?? null);
      return result ?? { reset: false, key };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to reset prompt template',
      );
    }
  }

  async create(dto: CreatePromptTemplateDto) {
    try {
      return await upsertPromptTemplate(this.prisma, dto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to create prompt template',
      );
    }
  }

  async update(id: string, dto: UpdatePromptTemplateDto) {
    try {
      return await updatePromptTemplate(this.prisma, id, dto);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update prompt template',
      );
    }
  }

  async reset(id: string) {
    try {
      return await resetPromptTemplateToDefault(this.prisma, id);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to reset prompt template',
      );
    }
  }

  async remove(id: string) {
    const existing = await getPromptTemplateById(this.prisma, id);
    if (!existing) {
      throw new NotFoundException(`Prompt template with id "${id}" not found`);
    }

    if (!existing.categoryId) {
      throw new BadRequestException('The global default prompt cannot be deleted');
    }

    await deletePromptTemplate(this.prisma, id);
    return { deleted: true };
  }
}
