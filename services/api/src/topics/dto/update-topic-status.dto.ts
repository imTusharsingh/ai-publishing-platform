import { IsEnum } from 'class-validator';
import { TopicStatus } from '@prisma/client';

export class UpdateTopicStatusDto {
  @IsEnum(TopicStatus)
  status!: TopicStatus;
}
