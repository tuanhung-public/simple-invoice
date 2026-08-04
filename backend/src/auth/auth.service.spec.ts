import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  const jwtService = {
    signAsync: jest.fn(),
  } as unknown as JwtService;

  const service = new AuthService(prisma, jwtService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns accessToken and user on valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'reviewer@101digital.io',
        fullname: 'Reviewer',
        passwordHash: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.signAsync as jest.Mock).mockResolvedValue('jwt-token');

      await expect(
        service.login({
          email: 'Reviewer@101digital.io',
          password: 'Password123!',
        }),
      ).resolves.toEqual({
        accessToken: 'jwt-token',
        user: {
          id: 'user-1',
          email: 'reviewer@101digital.io',
          fullname: 'Reviewer',
        },
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'reviewer@101digital.io' },
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'reviewer@101digital.io',
      });
    });

    it('rejects unknown email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'missing@example.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('rejects invalid password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'reviewer@101digital.io',
        fullname: 'Reviewer',
        passwordHash: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'reviewer@101digital.io',
          password: 'wrong',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('me', () => {
    it('returns the current user profile', async () => {
      const profile = {
        id: 'user-1',
        email: 'reviewer@101digital.io',
        fullname: 'Reviewer',
        createdAt: new Date('2026-01-01'),
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(profile);

      await expect(service.me('user-1')).resolves.toEqual(profile);
    });

    it('rejects when user no longer exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.me('missing')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
