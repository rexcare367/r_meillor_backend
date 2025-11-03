import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CurrentUser, Public } from './auth/decorators';
import { User } from '@supabase/supabase-js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public() // Public route
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/protected')
  async protected(@CurrentUser() user: User) {
    return {
      message: 'Authentication works! 🎉',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
