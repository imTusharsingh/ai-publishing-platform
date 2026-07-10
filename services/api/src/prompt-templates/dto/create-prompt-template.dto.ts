import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePromptTemplateDto {
  @IsString()
  @MaxLength(100)
  key!: string;

  @IsString()
  @MaxLength(200)
  name!: string;

  @IsString()
  body!: string;

  @IsArray()
  @IsString({ each: true })
  variables!: string[];

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
