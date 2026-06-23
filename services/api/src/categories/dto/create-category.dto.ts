import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PublishFrequency } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  keywords?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  priorityScore?: number;

  @IsOptional()
  @IsEnum(PublishFrequency)
  publishFrequency?: PublishFrequency;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  articlesPerCycle?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
