import { Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PublishingService } from './publishing.service';

@Controller('admin/publishing')
export class PublishingController {
  constructor(private readonly publishingService: PublishingService) {}

  @Post('trigger')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  triggerDailyPipeline() {
    return this.publishingService.triggerDailyPipeline();
  }
}
