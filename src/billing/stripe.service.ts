import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly webhookSecret?: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_API_KEY');

    if (!apiKey) {
      throw new Error(
        'Stripe configuration missing. Please set STRIPE_API_KEY in environment.',
      );
    }

    this.webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    this.stripe = new Stripe(apiKey);
  }

  getClient(): Stripe {
    return this.stripe;
  }

  getWebhookSecret(): string | undefined {
    return this.webhookSecret;
  }

  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    if (!this.webhookSecret) {
      throw new Error(
        'Missing STRIPE_WEBHOOK_SECRET configuration for webhook validation.',
      );
    }

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret,
    );
  }
}
