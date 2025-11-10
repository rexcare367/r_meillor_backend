import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { DatabaseService } from '../database/database.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { PauseSubscriptionDto } from './dto/pause-subscription.dto';
import { ResumeSubscriptionDto } from './dto/resume-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { QuerySubscriptionsDto } from './dto/query-subscriptions.dto';
import {
  Subscription,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { StripeService } from '../billing/stripe.service';
import { CustomersService } from '../billing/customers.service';
import { PlansService } from '../billing/plans.service';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ACTIVE_STATUSES = [
  SubscriptionStatus.Active,
  SubscriptionStatus.Trialing,
  SubscriptionStatus.PastDue,
  SubscriptionStatus.Unpaid,
  SubscriptionStatus.Incomplete,
];

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly stripeService: StripeService,
    private readonly customersService: CustomersService,
    private readonly plansService: PlansService,
  ) {}

  async create(
    requester: User,
    dto: CreateSubscriptionDto,
    isAdmin: boolean,
  ): Promise<Subscription> {
    const targetUserId = dto.user_id ?? requester.id;

    if (!this.isValidUUID(targetUserId)) {
      throw new BadRequestException('Invalid user identifier');
    }

    if (!isAdmin && targetUserId !== requester.id) {
      throw new ForbiddenException(
        'You are not allowed to create subscriptions for other users',
      );
    }

    await this.ensureUserCanStartNew(targetUserId);

    const priceResolution = await this.resolvePrice(dto);
    if (!priceResolution.priceId) {
      throw new BadRequestException(
        'A valid plan_id or stripe_price_id is required to create a subscription',
      );
    }

    const customerRecord = await this.customersService.ensureCustomer({
      userId: targetUserId,
      email: targetUserId === requester.id ? requester.email : undefined,
      name:
        targetUserId === requester.id
          ? (requester.user_metadata?.full_name ?? requester.email ?? undefined)
          : undefined,
      metadata: dto.metadata,
    });

    const stripe = this.stripeService.getClient();

    const subscription = await stripe.subscriptions.create({
      customer: customerRecord.stripe_customer_id,
      items: [{ price: priceResolution.priceId }],
      trial_period_days: dto.trial_period_days,
      metadata: {
        user_id: targetUserId,
        plan_id: priceResolution.planId ?? undefined,
        plan_name: priceResolution.planName ?? dto.plan ?? undefined,
        ...(dto.metadata ?? {}),
      },
      expand: ['latest_invoice', 'items.data.price.product'],
    });

    await this.syncFromStripe(subscription, dto.metadata ?? {});

    const created = await this.findByStripeSubscriptionId(subscription.id);

    if (!created) {
      throw new InternalServerErrorException(
        'Failed to persist subscription after Stripe creation',
      );
    }

    return created;
  }

  async findMine(userId: string): Promise<Subscription[]> {
    const client = this.databaseService.getClient();
    const { data, error } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch subscriptions: ${error.message}`,
      );
    }

    return (data || []) as Subscription[];
  }

  async findMyActive(userId: string): Promise<Subscription | null> {
    const client = this.databaseService.getClient();
    const { data, error } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ACTIVE_STATUSES)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new InternalServerErrorException(
        `Failed to fetch active subscription: ${error.message}`,
      );
    }

    return (data as Subscription) || null;
  }

  async findAll(
    query: QuerySubscriptionsDto,
  ): Promise<PaginatedResponse<Subscription>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      status,
      plan,
      plan_id,
      user_id,
      stripe_subscription_id,
      started_from,
      started_to,
    } = query;

    const client = this.databaseService.getClient();
    let supabaseQuery = client
      .from('subscriptions')
      .select('*', { count: 'exact' });

    if (status) {
      supabaseQuery = supabaseQuery.eq('status', status);
    }

    if (plan) {
      supabaseQuery = supabaseQuery.ilike('plan', `%${plan}%`);
    }

    if (plan_id) {
      supabaseQuery = supabaseQuery.eq('plan_id', plan_id);
    }

    if (user_id) {
      supabaseQuery = supabaseQuery.eq('user_id', user_id);
    }

    if (stripe_subscription_id) {
      supabaseQuery = supabaseQuery.eq(
        'stripe_subscription_id',
        stripe_subscription_id,
      );
    }

    if (started_from) {
      supabaseQuery = supabaseQuery.gte('started_at', started_from);
    }

    if (started_to) {
      supabaseQuery = supabaseQuery.lte('started_at', started_to);
    }

    const ascending = sortOrder === 'asc';
    supabaseQuery = supabaseQuery.order(sortBy, { ascending });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    supabaseQuery = supabaseQuery.range(from, to);

    const { data, error, count } = await supabaseQuery;

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch subscriptions: ${error.message}`,
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: (data || []) as Subscription[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(
    id: string,
    requesterId: string,
    isAdmin: boolean,
  ): Promise<Subscription> {
    const subscription = await this.getById(id);

    this.ensureAccess(subscription, requesterId, isAdmin);

    return subscription;
  }

  async update(
    id: string,
    requesterId: string,
    dto: UpdateSubscriptionDto,
    isAdmin: boolean,
  ): Promise<Subscription> {
    const subscription = await this.getById(id);
    this.ensureAccess(subscription, requesterId, isAdmin);

    const client = this.databaseService.getClient();
    let metadataMerged = false;

    if (subscription.stripe_subscription_id) {
      const stripe = this.stripeService.getClient();
      const currentStripe = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id,
        {
          expand: ['items.data.price.product', 'latest_invoice'],
        },
      );

      const priceResolution = await this.resolvePrice(dto);
      const firstItem = currentStripe.items.data[0];

      const updateParams: Stripe.SubscriptionUpdateParams = {};

      if (
        priceResolution.priceId &&
        firstItem &&
        priceResolution.priceId !== firstItem.price?.id
      ) {
        updateParams.items = [
          {
            id: firstItem.id,
            price: priceResolution.priceId,
          },
        ];
      }

      if (dto.metadata && Object.keys(dto.metadata).length > 0) {
        updateParams.metadata = {
          ...currentStripe.metadata,
          ...dto.metadata,
        };
      }

      if (Object.keys(updateParams).length > 0) {
        const updatedStripe = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          updateParams,
        );

        await this.syncFromStripe(updatedStripe, dto.metadata ?? {});
        metadataMerged = true;
      } else {
        // Ensure local record stays in sync even if no update performed
        await this.syncFromStripe(currentStripe, dto.metadata ?? {});
        metadataMerged = true;
      }
    }

    const updates: Record<string, any> = {
      last_event_at: new Date().toISOString(),
    };

    if (!subscription.stripe_subscription_id && dto.status) {
      updates.status = dto.status;
    }

    if (!subscription.stripe_subscription_id && dto.plan) {
      updates.plan = dto.plan;
    }

    if (!subscription.stripe_subscription_id && dto.plan_id) {
      updates.plan_id = dto.plan_id;
    }

    if (dto.started_at) {
      updates.started_at = dto.started_at;
    }

    if (dto.ended_at !== undefined) {
      updates.ended_at = dto.ended_at ?? null;
    }

    if (dto.pause_reason !== undefined) {
      updates.pause_reason = dto.pause_reason ?? null;
    }

    if (dto.cancel_reason !== undefined) {
      updates.cancel_reason = dto.cancel_reason ?? null;
    }

    if (dto.stripe_invoice_url !== undefined) {
      updates.stripe_invoice_url = dto.stripe_invoice_url ?? null;
    }

    if (!metadataMerged && dto.metadata) {
      updates.metadata = this.mergeMetadata(
        subscription.metadata,
        dto.metadata,
      );
    }

    delete updates.user_id;

    this.sanitizePayload(updates);

    if (Object.keys(updates).length > 1) {
      const { error } = await client
        .from('subscriptions')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw new InternalServerErrorException(
          `Failed to update subscription: ${error.message}`,
        );
      }
    }

    return this.getById(id);
  }

  async pause(
    id: string,
    requesterId: string,
    dto: PauseSubscriptionDto,
    isAdmin: boolean,
  ): Promise<Subscription> {
    const subscription = await this.getById(id);
    this.ensureAccess(subscription, requesterId, isAdmin);

    if (!ACTIVE_STATUSES.includes(subscription.status)) {
      throw new BadRequestException('Only active subscriptions can be paused');
    }

    const client = this.databaseService.getClient();

    if (subscription.stripe_subscription_id) {
      const stripe = this.stripeService.getClient();
      const updatedStripe = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          pause_collection: { behavior: 'mark_uncollectible' },
          metadata: dto.reason
            ? {
                pause_reason: dto.reason,
              }
            : undefined,
        },
      );

      await this.syncFromStripe(updatedStripe, {
        pause_reason: dto.reason ?? undefined,
      });
    }

    const nowIso = new Date().toISOString();
    const updates: Record<string, any> = {
      pause_reason: dto.reason ?? null,
      last_event_at: nowIso,
    };

    if (!subscription.stripe_subscription_id) {
      updates.status = SubscriptionStatus.Paused;
      updates.ended_at = nowIso;
    }

    this.sanitizePayload(updates);

    const { error } = await client
      .from('subscriptions')
      .update(updates)
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to pause subscription: ${error.message}`,
      );
    }

    return this.getById(id);
  }

  async resume(
    id: string,
    requesterId: string,
    dto: ResumeSubscriptionDto,
    isAdmin: boolean,
  ): Promise<Subscription> {
    const subscription = await this.getById(id);
    this.ensureAccess(subscription, requesterId, isAdmin);

    if (subscription.status !== SubscriptionStatus.Paused) {
      throw new BadRequestException('Only paused subscriptions can be resumed');
    }

    const client = this.databaseService.getClient();

    if (subscription.stripe_subscription_id) {
      const stripe = this.stripeService.getClient();
      const updatedStripe = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          pause_collection: null,
        },
      );

      await this.syncFromStripe(updatedStripe);
    }

    const nowIso = new Date().toISOString();
    const updates: Record<string, any> = {
      pause_reason: null,
      last_event_at: nowIso,
    };

    if (!subscription.stripe_subscription_id) {
      updates.status = SubscriptionStatus.Active;
      updates.ended_at = null;

      if (!subscription.started_at) {
        updates.started_at = nowIso;
      }
    }

    if (dto.plan && !subscription.stripe_subscription_id) {
      updates.plan = dto.plan;
    }

    if (dto.stripe_invoice_url) {
      updates.stripe_invoice_url = dto.stripe_invoice_url;
    }

    this.sanitizePayload(updates);

    const { error } = await client
      .from('subscriptions')
      .update(updates)
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to resume subscription: ${error.message}`,
      );
    }

    return this.getById(id);
  }

  async cancel(
    id: string,
    requesterId: string,
    dto: CancelSubscriptionDto,
    isAdmin: boolean,
  ): Promise<Subscription> {
    const subscription = await this.getById(id);
    this.ensureAccess(subscription, requesterId, isAdmin);

    if (subscription.status === SubscriptionStatus.Canceled) {
      throw new BadRequestException('Subscription is already canceled');
    }

    const client = this.databaseService.getClient();

    if (subscription.stripe_subscription_id) {
      const stripe = this.stripeService.getClient();
      const canceledStripe = await stripe.subscriptions.cancel(
        subscription.stripe_subscription_id,
        {
          invoice_now: false,
          prorate: false,
        },
      );

      await this.syncFromStripe(canceledStripe, {
        cancel_reason: dto.reason ?? undefined,
      });
    }

    const nowIso = new Date().toISOString();
    const updates: Record<string, any> = {
      cancel_reason: dto.reason ?? null,
      stripe_invoice_url:
        dto.stripe_invoice_url ?? subscription.stripe_invoice_url,
      last_event_at: nowIso,
    };

    if (!subscription.stripe_subscription_id) {
      updates.status = SubscriptionStatus.Canceled;
      updates.ended_at = nowIso;
    }

    this.sanitizePayload(updates);

    const { error } = await client
      .from('subscriptions')
      .update(updates)
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to cancel subscription: ${error.message}`,
      );
    }

    return this.getById(id);
  }

  async remove(
    id: string,
    requesterId: string,
    isAdmin: boolean,
  ): Promise<void> {
    const subscription = await this.getById(id);
    this.ensureAccess(subscription, requesterId, isAdmin);

    if (
      !isAdmin &&
      ![SubscriptionStatus.Canceled, SubscriptionStatus.Expired].includes(
        subscription.status,
      )
    ) {
      throw new BadRequestException(
        'Only canceled or expired subscriptions can be deleted',
      );
    }

    if (
      subscription.stripe_subscription_id &&
      subscription.status !== SubscriptionStatus.Canceled
    ) {
      await this.cancel(
        id,
        requesterId,
        { reason: 'Deleted via API' },
        isAdmin,
      );
    }

    const client = this.databaseService.getClient();
    const { error } = await client.from('subscriptions').delete().eq('id', id);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to delete subscription: ${error.message}`,
      );
    }
  }

  async findByUserId(userId: string): Promise<Subscription[]> {
    if (!this.isValidUUID(userId)) {
      throw new BadRequestException('Invalid user identifier');
    }

    const client = this.databaseService.getClient();
    const { data, error } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch user subscriptions: ${error.message}`,
      );
    }

    return (data || []) as Subscription[];
  }

  private async ensureUserCanStartNew(userId: string) {
    const client = this.databaseService.getClient();
    const { data, error } = await client
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', userId)
      .in('status', [...ACTIVE_STATUSES, SubscriptionStatus.Paused])
      .limit(1);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to validate subscription state: ${error.message}`,
      );
    }

    if (data && data.length > 0) {
      throw new BadRequestException(
        'An active subscription already exists for this user',
      );
    }
  }

  private ensureAccess(
    subscription: Subscription,
    requesterId: string,
    isAdmin: boolean,
  ) {
    if (isAdmin) {
      return;
    }

    if (subscription.user_id !== requesterId) {
      throw new ForbiddenException(
        'You are not allowed to access this subscription',
      );
    }
  }

  private async getById(id: string): Promise<Subscription> {
    if (!this.isValidUUID(id)) {
      throw new BadRequestException('Invalid subscription identifier');
    }

    const client = this.databaseService.getClient();
    const { data, error } = await client
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Subscription with id "${id}" not found`);
    }

    return data as Subscription;
  }

  private async findByStripeSubscriptionId(
    stripeId: string,
  ): Promise<Subscription | null> {
    const client = this.databaseService.getClient();
    const { data } = await client
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', stripeId)
      .maybeSingle();

    return (data as Subscription) ?? null;
  }

  private async resolvePrice(
    dto: Pick<CreateSubscriptionDto, 'plan_id' | 'stripe_price_id' | 'plan'> &
      Partial<UpdateSubscriptionDto>,
  ): Promise<{
    priceId: string | null;
    planId: string | null;
    planName: string | null;
  }> {
    if (dto.plan_id) {
      const plan = await this.plansService.findOne(dto.plan_id);
      return {
        priceId: plan.stripe_price_id,
        planId: plan.id,
        planName: plan.name,
      };
    }

    if (dto.stripe_price_id) {
      const plan = await this.plansService.findByStripePrice(
        dto.stripe_price_id,
      );
      return {
        priceId: dto.stripe_price_id,
        planId: plan?.id ?? null,
        planName: plan?.name ?? dto.plan ?? null,
      };
    }

    return {
      priceId: null,
      planId: null,
      planName: dto.plan ?? null,
    };
  }

  async handleCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
    if (!session || session.mode !== 'subscription') {
      return;
    }

    let subscriptionId: string | null = null;
    if (typeof session.subscription === 'string') {
      subscriptionId = session.subscription;
    } else if (session.subscription?.id) {
      subscriptionId = session.subscription.id;
    }

    if (!subscriptionId) {
      return;
    }

    const stripe = this.stripeService.getClient();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice', 'items.data.price.product'],
    });

    const metadata =
      session.metadata && Object.keys(session.metadata).length > 0
        ? { ...session.metadata }
        : {};

    await this.syncFromStripe(subscription, metadata);
  }

  async syncFromStripe(
    subscription: Stripe.Subscription,
    customMetadata: Record<string, any> = {},
  ): Promise<void> {
    const client = this.databaseService.getClient();
    const existing = await this.findByStripeSubscriptionId(subscription.id);

    const stripeCustomerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : (subscription.customer?.id ?? null);

    if (!stripeCustomerId) {
      return;
    }

    console.log('stripeCustomerId', stripeCustomerId);

    let userId = existing?.user_id ?? null;

    if (!userId) {
      const { data: mapping } = await client
        .from('stripe_customers')
        .select('user_id')
        .eq('stripe_customer_id', stripeCustomerId)
        .maybeSingle();
      userId = mapping?.user_id ?? null;
    }

    if (!userId && subscription.metadata?.user_id) {
      userId = subscription.metadata.user_id as string;
    }

    if (!userId) {
      return;
    }

    console.log('userId', userId);

    const price = subscription.items.data[0]?.price;
    const plan = price?.id
      ? await this.plansService.findByStripePrice(price.id)
      : null;

    const invoiceUrl = await this.extractInvoiceUrl(subscription);
    const metadata = this.mergeMetadata(
      existing?.metadata,
      customMetadata,
      subscription.metadata ?? {},
    );

    const payload = {
      user_id: userId,
      plan: plan?.name ?? existing?.plan ?? price?.nickname ?? null,
      plan_id: plan?.id ?? existing?.plan_id ?? null,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: stripeCustomerId,
      status: this.mapStripeStatus(subscription),
      started_at: this.convertTimestamp(subscription.start_date),
      current_period_start: this.convertTimestamp(
        subscription.current_period_start,
      ),
      current_period_end: this.convertTimestamp(
        subscription.current_period_end,
      ),
      ended_at: this.convertTimestamp(subscription.ended_at),
      cancel_at: this.convertTimestamp(subscription.cancel_at),
      canceled_at: this.convertTimestamp(subscription.canceled_at),
      stripe_invoice_url: invoiceUrl ?? existing?.stripe_invoice_url ?? null,
      pause_reason: subscription.pause_collection?.behavior ?? null,
      metadata,
      last_event_at: new Date().toISOString(),
    };

    console.log('payload', payload);

    if (
      subscription.status === 'canceled' &&
      !payload.canceled_at &&
      subscription.ended_at
    ) {
      payload.canceled_at = this.convertTimestamp(subscription.ended_at);
    }

    console.log('existing', existing);

    if (existing?.id) {
      const { data, error } = await client
        .from('subscriptions')
        .update(payload)
        .eq('id', existing.id);
      console.log('data', data);
      console.log('error', error);
      if (error) {
        throw new InternalServerErrorException(
          `Failed to update subscription: ${error.message}`,
        );
      }
    } else {
      const { data, error } = await client
        .from('subscriptions')
        .insert([payload]);
      console.log('data', data);
      console.log('error', error);
      if (error) {
        throw new InternalServerErrorException(
          `Failed to insert subscription: ${error.message}`,
        );
      }
    }
  }

  private async extractInvoiceUrl(
    subscription: Stripe.Subscription,
  ): Promise<string | null> {
    const latestInvoice = subscription.latest_invoice;
    if (!latestInvoice) {
      return null;
    }

    if (typeof latestInvoice === 'string') {
      try {
        const invoice = await this.stripeService
          .getClient()
          .invoices.retrieve(latestInvoice);
        return invoice.hosted_invoice_url ?? invoice.invoice_pdf ?? null;
      } catch {
        return null;
      }
    }

    return (
      latestInvoice.hosted_invoice_url ?? latestInvoice.invoice_pdf ?? null
    );
  }

  private mapStripeStatus(
    subscription: Stripe.Subscription,
  ): SubscriptionStatus {
    if (subscription.pause_collection) {
      return SubscriptionStatus.Paused;
    }

    switch (subscription.status) {
      case 'active':
        return SubscriptionStatus.Active;
      case 'trialing':
        return SubscriptionStatus.Trialing;
      case 'past_due':
        return SubscriptionStatus.PastDue;
      case 'canceled':
        return SubscriptionStatus.Canceled;
      case 'incomplete':
        return SubscriptionStatus.Incomplete;
      case 'incomplete_expired':
        return SubscriptionStatus.IncompleteExpired;
      case 'unpaid':
        return SubscriptionStatus.Unpaid;
      default:
        return SubscriptionStatus.Expired;
    }
  }

  private convertTimestamp(value?: number | null): string | null {
    if (!value) {
      return null;
    }
    return new Date(value * 1000).toISOString();
  }

  private mergeMetadata(
    existing: Record<string, any> | null | undefined,
    custom?: Record<string, any>,
    stripeMetadata?: Stripe.Metadata,
  ): Record<string, any> {
    const metadata =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? { ...existing }
        : {};

    if (custom && Object.keys(custom).length > 0) {
      metadata.custom = {
        ...(metadata.custom ?? {}),
        ...custom,
      };
    }

    metadata.stripe = stripeMetadata ?? metadata.stripe ?? {};

    return metadata;
  }

  private isValidUUID(uuid: string): boolean {
    const regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  }

  private sanitizePayload(payload: Record<string, any>) {
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
  }
}
