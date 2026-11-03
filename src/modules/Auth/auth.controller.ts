import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ResponseCode,
  ResponseMessage,
} from '../../common/interceptors/response.interceptor.js';
import { AuthService } from './auth.service.js';
import {
  AuthResponseDTO,
  UserAuthDTO,
  UserProfileDTO,
} from './dto/UserAuthDTO.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ResponseCode('AUTH_REGISTER_SUCCESS')
  @ResponseMessage('User registered successfully')
  @ApiCreatedResponse({
    description: 'User successfully registered',
    type: AuthResponseDTO,
  })
  @ApiConflictResponse({ description: 'Email already registered' })
  register(@Body() dto: UserAuthDTO) {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user with credentials' })
  @ResponseCode('AUTH_LOGIN_SUCCESS')
  @ResponseMessage('Login successful')
  @ApiOkResponse({
    description: 'Login successful',
    type: AuthResponseDTO,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() dto: UserAuthDTO) {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile of authenticated user' })
  @ResponseCode('AUTH_GET_PROFILE_SUCCESS')
  @ResponseMessage('Profile fetched successfully')
  @ApiOkResponse({
    description: 'Profile fetched successfully',
    type: UserProfileDTO,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized or invalid token' })
  getProfile(@Headers('authorization') authHeader?: string) {
    return this.authService.getProfile(authHeader);
  }
}
