import { IsEnum } from 'class-validator';
import { ArticleIdeaStatus } from '@prisma/client';

export class UpdateArticleIdeaStatusDto {
  @IsEnum(ArticleIdeaStatus)
  status!: ArticleIdeaStatus;
}
