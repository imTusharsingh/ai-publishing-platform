import { IsEnum } from 'class-validator';
import { ArticleStatus } from '@prisma/client';

export class UpdateArticleStatusDto {
  @IsEnum(ArticleStatus)
  status!: ArticleStatus;
}
