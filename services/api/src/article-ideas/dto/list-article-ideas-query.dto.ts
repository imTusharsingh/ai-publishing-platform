import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { ArticleIdeaStatus } from '@prisma/client';

export class ListArticleIdeasQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsEnum(ArticleIdeaStatus)
  status?: ArticleIdeaStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
