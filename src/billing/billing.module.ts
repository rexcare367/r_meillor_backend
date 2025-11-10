import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { DatabaseModule } from '../database/database.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { AuthModule } from '../auth/auth.module';
import { StripeWebhookController } from './webhook.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CheckoutController } from './checkout.controller';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [
    PlansController,
    CustomersController,
    StripeWebhookController,
    CheckoutController,
  ],
  providers: [StripeService, PlansService, CustomersService],
  exports: [StripeService, CustomersService, PlansService],
})
export class BillingModule {}
