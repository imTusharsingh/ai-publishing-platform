import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateArticleIdeaDto {
  @IsUUID()
  categoryId!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @IsUUID()
  trendingTopicId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  intent?: string;
}
