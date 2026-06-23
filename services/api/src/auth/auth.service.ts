import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokens, AuthUser, JwtExpiresIn, JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const storedToken = await this.findValidRefreshToken(refreshToken);
    const user = await this.prisma.user.findUnique({
      where: { id: storedToken.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async logout(refreshToken: string): Promise<void> {
    const storedToken = await this.findValidRefreshToken(refreshToken);

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(user: AuthUser): Promise<AuthTokens> {
    const expiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: expiresIn as JwtExpiresIn,
    });
    const refreshToken = randomBytes(48).toString('hex');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: this.addDuration(new Date(), refreshExpiresIn),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
      user,
    };
  }

  private async findValidRefreshToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return storedToken;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private addDuration(from: Date, duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid duration format: ${duration}`);
    }

    const value = Number.parseInt(match[1], 10);
    const unit = match[2];
    const result = new Date(from);

    switch (unit) {
      case 's':
        result.setSeconds(result.getSeconds() + value);
        break;
      case 'm':
        result.setMinutes(result.getMinutes() + value);
        break;
      case 'h':
        result.setHours(result.getHours() + value);
        break;
      case 'd':
        result.setDate(result.getDate() + value);
        break;
    }

    return result;
  }
}
