import { ApiProperty } from '@nestjs/swagger';

export class UserAuthDTO {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password (minimum 6 characters)',
  })
  password!: string;
}

export class UserSummaryDTO {
  @ApiProperty({ example: 'b0e00868-8096-41f2-ba2d-4d7a8d5f3083' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: '2026-11-03T07:00:00.000Z' })
  createdAt!: Date;
}

export class AuthResponseDTO {
  @ApiProperty({ example: '6c1a89c6cf2ff48f889c...' })
  accessToken!: string;

  @ApiProperty({ type: () => UserSummaryDTO })
  user!: UserSummaryDTO;
}

export class UserProfileDTO extends UserSummaryDTO {}
