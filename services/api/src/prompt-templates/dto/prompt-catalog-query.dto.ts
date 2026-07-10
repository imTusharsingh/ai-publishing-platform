import { IsOptional, IsUUID } from 'class-validator';

export class PromptCatalogQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
