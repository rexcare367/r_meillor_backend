import { Module, forwardRef } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { BillingModule } from '../billing/billing.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [BillingModule, forwardRef(() => SubscriptionsModule)],
  controllers: [ProfileController],
})
export class ProfileModule {}

