import { Body, Controller, Post } from '@nestjs/common';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { CurrentUser } from '../auth/decorators';
import { User } from '@supabase/supabase-js';
import { CustomersService } from './customers.service';
import { StripeService } from './stripe.service';

@Controller('billing/checkout')
export class CheckoutController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('session')
  async createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
    @CurrentUser() user: User,
  ) {
    const customerRecord = await this.customersService.ensureCustomer({
      userId: user.id,
      email: user.email ?? undefined,
      name:
        user.user_metadata?.full_name ??
        user.email ??
        user.user_metadata?.name ??
        undefined,
    });

    const stripe = this.stripeService.getClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerRecord.stripe_customer_id,
      line_items: [
        {
          price: dto.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: dto.success_url,
      cancel_url: dto.cancel_url,
      metadata: {
        user_id: user.id,
      },
    });

    return {
      url: session.url,
      session_id: session.id,
    };
  }
}


