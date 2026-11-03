import { Module } from '@nestjs/common';
import { AuthModule } from './modules/Auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
