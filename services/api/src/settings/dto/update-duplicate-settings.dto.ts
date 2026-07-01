import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateDuplicateSettingsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(1)
  titleThreshold!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(1)
  summaryThreshold!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(1)
  contentThreshold!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  topicCooldownDays!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(1)
  clusterDistanceThreshold!: number;
}
