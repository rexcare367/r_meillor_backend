import {
  BadRequestException,
  Controller,
  forwardRef,
  Headers,
  Inject,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { PlansService } from './plans.service';
import { CustomersService } from './customers.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Public } from '../auth/decorators';

@Controller('billing/stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly plansService: PlansService,
    private readonly customersService: CustomersService,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Public()
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature header');
    }

    let event: Stripe.Event;

    try {
      const rawPayload = req.rawBody ?? (req.body as Buffer | undefined);
      if (!rawPayload) {
        throw new Error('No webhook payload was provided.');
      }

      if (!Buffer.isBuffer(rawPayload)) {
        throw new Error(
          'Stripe webhook requires the request body to be provided as a Buffer.',
        );
      }

      event = this.stripeService.constructEvent(rawPayload, signature);
    } catch (error) {
      throw new BadRequestException(
        `Unable to process Stripe webhook: ${(error as Error).message}`,
      );
    }

    const dataObject = event.data.object as Stripe.Event.Data.Object;

    console.log('event.type', event.type);

    switch (event.type) {
      case 'product.created':
      case 'product.updated':
      case 'product.deleted':
        await this.plansService.syncFromProduct(dataObject as Stripe.Product);
        break;
      case 'price.created':
      case 'price.updated':
      case 'price.deleted':
        await this.plansService.syncFromPrice(dataObject as Stripe.Price);
        break;
      case 'customer.created':
      case 'customer.updated':
        await this.customersService.syncFromStripe(
          dataObject as Stripe.Customer,
        );
        break;
      case 'customer.deleted': {
        const customer = dataObject as Stripe.DeletedCustomer;
        if (!customer.deleted) {
          break;
        }
        await this.customersService.deleteByStripeId(customer.id, false);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
        await this.subscriptionsService.syncFromStripe(
          dataObject as Stripe.Subscription,
        );
        break;
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.async_payment_succeeded':
      case 'checkout.session.completed':
      case 'checkout.session.expired':
        await this.subscriptionsService.handleCheckoutSession(
          dataObject as Stripe.Checkout.Session,
        );
        break;
      default:
        // No action required for other events
        break;
    }

    return { received: true };
  }
}
