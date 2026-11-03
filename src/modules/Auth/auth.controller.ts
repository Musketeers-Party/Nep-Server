import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UserAuthDTO } from './dto/UserAuthDTO.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: UserAuthDTO) {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: UserAuthDTO) {
    return this.authService.login(dto);
  }

  @Get('me')
  getProfile(@Headers('authorization') authHeader?: string) {
    return this.authService.getProfile(authHeader);
  }
}
