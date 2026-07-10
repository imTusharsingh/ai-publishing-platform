import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListPromptTemplatesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  key?: string;
}
