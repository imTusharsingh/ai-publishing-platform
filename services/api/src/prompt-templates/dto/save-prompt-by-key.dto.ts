import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SavePromptByKeyDto {
  @IsString()
  body!: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;
}

export class ResetPromptByKeyDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;
}
