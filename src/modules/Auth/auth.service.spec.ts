import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
  });

  it('registers a new user and returns access token', async () => {
    const res = await service.register({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.accessToken).toBeDefined();
    expect(res.user.email).toBe('test@example.com');
  });

  it('rejects duplicate registration', async () => {
    await service.register({
      email: 'test@example.com',
      password: 'password123',
    });

    await expect(
      service.register({
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('authenticates user and returns profile', async () => {
    const registerRes = await service.register({
      email: 'user@example.com',
      password: 'secretpassword',
    });

    const loginRes = await service.login({
      email: 'user@example.com',
      password: 'secretpassword',
    });
    expect(loginRes.accessToken).toBeDefined();

    const profile = await service.getProfile(
      `Bearer ${registerRes.accessToken}`,
    );
    expect(profile.email).toBe('user@example.com');
  });

  it('rejects invalid password', async () => {
    await service.register({
      email: 'user@example.com',
      password: 'secretpassword',
    });

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'wrongpassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
