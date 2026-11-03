import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import { UserAuthDTO } from './dto/UserAuthDTO.js';

export interface AuthUser {
  id: string;
  email: string;
  createdAt: Date;
}

interface StoredUser extends AuthUser {
  passwordHash: string;
}

@Injectable()
export class AuthService {
  // shortcut: in-memory user and session storage, replace with database/JWT when persistence is added
  private readonly users = new Map<string, StoredUser>();
  private readonly sessions = new Map<string, string>();

  async register(dto: UserAuthDTO) {
    this.validateCredentials(dto);

    const email = dto.email.trim().toLowerCase();
    if (this.users.has(email)) {
      throw new ConflictException('Email already registered');
    }

    const user: StoredUser = {
      id: randomUUID(),
      email,
      passwordHash: this.hashPassword(dto.password),
      createdAt: new Date(),
    };

    this.users.set(email, user);

    const accessToken = this.createSession(user.id);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  async login(dto: UserAuthDTO) {
    this.validateCredentials(dto);

    const email = dto.email.trim().toLowerCase();
    const user = this.users.get(email);
    if (!user || !this.verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.createSession(user.id);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  async getProfile(authHeader?: string): Promise<AuthUser> {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is required');
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader.trim();

    const userId = this.sessions.get(token);
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const user = Array.from(this.users.values()).find((u) => u.id === userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  private validateCredentials(dto: UserAuthDTO) {
    if (!dto?.email || !dto?.password) {
      throw new BadRequestException('Email and password are required');
    }
    if (!dto.email.includes('@')) {
      throw new BadRequestException('Valid email address is required');
    }
    if (dto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, stored: string): boolean {
    const [salt, key] = stored.split(':');
    if (!salt || !key) return false;
    const hash = scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    return timingSafeEqual(hash, keyBuffer);
  }

  private createSession(userId: string): string {
    const token = randomBytes(32).toString('hex');
    this.sessions.set(token, userId);
    return token;
  }
}
