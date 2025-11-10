import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { DatabaseService } from '../database/database.service';
import { AuthService } from '../auth/auth.service';
import Stripe from 'stripe';

export interface CustomerRecord {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface EnsureCustomerOptions {
  userId: string;
  email?: string | null;
  name?: string | null;
  metadata?: Record<string, any>;
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService,
  ) {}

  async ensureCustomer(
    options: EnsureCustomerOptions,
  ): Promise<CustomerRecord> {
    const existing = await this.findByUserId(options.userId);
    const stripe = this.stripeService.getClient();

    const email =
      options.email ?? (await this.fetchUserEmail(options.userId)) ?? undefined;

    if (existing) {
      if (email && existing.email !== email) {
        await stripe.customers.update(existing.stripe_customer_id, { email });
        await this.updateLocal(existing.id, { email });
      }
      return existing;
    }

    const customer = await stripe.customers.create({
      email,
      name: options.name ?? undefined,
      metadata: {
        user_id: options.userId,
        ...(options.metadata ?? {}),
      },
    });

    const payload = {
      user_id: options.userId,
      stripe_customer_id: customer.id,
      email: customer.email ?? email ?? null,
      metadata: customer.metadata ?? options.metadata ?? {},
      updated_at: new Date().toISOString(),
    };

    const client = this.databaseService.getClient();
    const { data, error } = await client
      .from('stripe_customers')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to store Stripe customer mapping: ${error.message}`,
      );
    }

    return data as CustomerRecord;
  }

  async findByUserId(userId: string): Promise<CustomerRecord | null> {
    const client = this.databaseService.getClient();
    const { data } = await client
      .from('stripe_customers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return (data as CustomerRecord) ?? null;
  }

  async getStripeCustomer(userId: string): Promise<Stripe.Customer | null> {
    const record = await this.findByUserId(userId);
    if (!record) {
      return null;
    }

    const stripe = this.stripeService.getClient();
    return (await stripe.customers.retrieve(
      record.stripe_customer_id,
    )) as Stripe.Customer;
  }

  async updateCustomerMetadata(
    userId: string,
    metadata: Record<string, any>,
  ): Promise<CustomerRecord> {
    const record = await this.findByUserId(userId);

    if (!record) {
      throw new NotFoundException('Stripe customer not found for user');
    }

    const stripe = this.stripeService.getClient();
    await stripe.customers.update(record.stripe_customer_id, { metadata });

    return this.updateLocal(record.id, { metadata });
  }

  async deleteCustomer(
    userId: string,
    deleteFromStripe = false,
  ): Promise<void> {
    const record = await this.findByUserId(userId);
    if (!record) {
      return;
    }

    const stripe = this.stripeService.getClient();

    if (deleteFromStripe) {
      await stripe.customers.del(record.stripe_customer_id);
    }

    const client = this.databaseService.getClient();
    const { error } = await client
      .from('stripe_customers')
      .delete()
      .eq('id', record.id);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to delete stripe customer mapping: ${error.message}`,
      );
    }
  }

  async deleteByStripeId(
    stripeCustomerId: string,
    deleteFromStripe = false,
  ): Promise<void> {
    const client = this.databaseService.getClient();
    const { data } = await client
      .from('stripe_customers')
      .select('*')
      .eq('stripe_customer_id', stripeCustomerId)
      .maybeSingle();

    if (!data) {
      return;
    }

    if (deleteFromStripe) {
      const stripe = this.stripeService.getClient();
      await stripe.customers.del(stripeCustomerId);
    }

    const { error } = await client
      .from('stripe_customers')
      .delete()
      .eq('stripe_customer_id', stripeCustomerId);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to delete stripe customer mapping: ${error.message}`,
      );
    }
  }

  async syncFromStripe(customer: Stripe.Customer): Promise<void> {
    const client = this.databaseService.getClient();
    const { data } = await client
      .from('stripe_customers')
      .select('id')
      .eq('stripe_customer_id', customer.id)
      .maybeSingle();

    const payload = {
      email: (customer.email ?? null) as string | null,
      metadata: customer.metadata ?? {},
      updated_at: new Date().toISOString(),
    };

    if (data?.id) {
      await client.from('stripe_customers').update(payload).eq('id', data.id);
      return;
    }

    if (!customer.metadata?.user_id) {
      return;
    }

    await client.from('stripe_customers').insert([
      {
        user_id: customer.metadata.user_id as string,
        stripe_customer_id: customer.id,
        email: customer.email ?? null,
        metadata: customer.metadata ?? {},
        updated_at: new Date().toISOString(),
      },
    ]);
  }

  private async updateLocal(
    id: string,
    fields: Partial<CustomerRecord>,
  ): Promise<CustomerRecord> {
    const client = this.databaseService.getClient();
    const { data, error } = await client
      .from('stripe_customers')
      .update({
        ...fields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException(
        `Failed to update stripe customer mapping: ${error?.message}`,
      );
    }

    return data as CustomerRecord;
  }

  private async fetchUserEmail(userId: string): Promise<string | null> {
    try {
      const supabase = this.authService.getSupabaseClient();
      const { data } = await supabase.auth.admin.getUserById(userId);
      return data?.user?.email ?? null;
    } catch (error: any) {
      console.error('Error fetching user email:', error);
      return null;
    }
  }
}
