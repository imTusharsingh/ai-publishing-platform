import { Module } from '@nestjs/common';
import { DuplicateRejectionsController } from './duplicate-rejections.controller';
import { DuplicateRejectionsService } from './duplicate-rejections.service';

@Module({
  controllers: [DuplicateRejectionsController],
  providers: [DuplicateRejectionsService],
})
export class DuplicateRejectionsModule {}
