import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { ListTopicsQueryDto } from './dto/list-topics-query.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { UpdateTopicStatusDto } from './dto/update-topic-status.dto';
import { TopicsService } from './topics.service';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  findAll(@Query() query: ListTopicsQueryDto) {
    return this.topicsService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.topicsService.findById(id);
  }

  @Post('discover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  discover() {
    return this.topicsService.enqueueDiscovery();
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTopicStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.topicsService.updateStatus(id, dto.status, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.EDITOR)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTopicDto) {
    return this.topicsService.update(id, dto);
  }
}
