import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators';
import { User } from '@supabase/supabase-js';
import { CustomersService } from '../billing/customers.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get('me')
  async getMyProfile(@CurrentUser() user: User) {
    const [customer, subscriptions, activeSubscription] = await Promise.all([
      this.customersService.findByUserId(user.id),
      this.subscriptionsService.findMine(user.id),
      this.subscriptionsService.findMyActive(user.id),
    ]);

    return {
      user: {
        id: user.id,
        email: user.email,
        app_metadata: (user as any).app_metadata ?? {},
        user_metadata: user.user_metadata ?? {},
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      stripe_customer: customer,
      subscriptions: {
        active: activeSubscription,
        all: subscriptions,
      },
    };
  }
}

