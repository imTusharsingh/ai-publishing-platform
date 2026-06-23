import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    refreshToken: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwtService: { signAsync: jest.Mock };
  let configService: { get: jest.Mock; getOrThrow: jest.Mock };

  const adminUser = {
    id: 'user-1',
    email: 'admin@example.com',
    passwordHash: '',
    role: UserRole.SUPER_ADMIN,
    isActive: true,
  };

  beforeEach(async () => {
    adminUser.passwordHash = await bcrypt.hash('Admin123!', 12);

    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue(adminUser),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt-1' }),
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'rt-1' }),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    };

    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return values[key];
      }),
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  it('returns tokens when credentials are valid', async () => {
    prisma.user.findUnique.mockResolvedValue(adminUser);

    const result = await service.login('admin@example.com', 'Admin123!');

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toHaveLength(96);
    expect(result.tokenType).toBe('Bearer');
    expect(result.user.email).toBe('admin@example.com');
    expect(prisma.refreshToken.create).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('rejects invalid password', async () => {
    prisma.user.findUnique.mockResolvedValue(adminUser);

    await expect(service.login('admin@example.com', 'wrong-password')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects inactive user', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...adminUser, isActive: false });

    await expect(service.login('admin@example.com', 'Admin123!')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rotates refresh token on refresh', async () => {
    prisma.refreshToken.findFirst.mockResolvedValue({
      id: 'rt-1',
      userId: adminUser.id,
    });
    prisma.user.findUnique.mockResolvedValue(adminUser);

    const result = await service.refresh('a'.repeat(96));

    expect(result.accessToken).toBe('access-token');
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt-1' },
      data: { revokedAt: expect.any(Date) },
    });
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('revokes refresh token on logout', async () => {
    prisma.refreshToken.findFirst.mockResolvedValue({
      id: 'rt-1',
      userId: adminUser.id,
    });

    await service.logout('a'.repeat(96));

    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt-1' },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
