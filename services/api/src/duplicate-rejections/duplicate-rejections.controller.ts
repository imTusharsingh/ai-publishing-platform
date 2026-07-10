import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DuplicateRejectionsService } from './duplicate-rejections.service';
import { ListDuplicateRejectionsQueryDto } from './dto/list-duplicate-rejections-query.dto';

@Controller('admin/duplicate-rejections')
export class DuplicateRejectionsController {
  constructor(private readonly duplicateRejectionsService: DuplicateRejectionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  findAll(@Query() query: ListDuplicateRejectionsQueryDto) {
    return this.duplicateRejectionsService.findAll(query);
  }
}
