import { Injectable } from '@nestjs/common';
import { getAdminDashboardMetrics } from '@repo/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  getMetrics() {
    return getAdminDashboardMetrics(this.prisma);
  }
}
