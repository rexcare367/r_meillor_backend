import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { DatabaseService } from '../database/database.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from './entities/plan.entity';

interface QueryOptions {
  onlyActive?: boolean;
}

@Injectable()
export class PlansService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly databaseService: DatabaseService,
  ) {}

  async create(dto: CreatePlanDto): Promise<Plan> {
    const stripe = this.stripeService.getClient();

    const product = await stripe.products.create({
      name: dto.name,
      description: dto.description,
      metadata: dto.metadata,
      active: true,
    });

    const price = await stripe.prices.create({
      currency: dto.currency,
      unit_amount: dto.amount,
      recurring: {
        interval: dto.interval as Stripe.PriceCreateParams.Recurring.Interval,
        interval_count: dto.interval_count,
      },
      product: product.id,
      metadata: dto.metadata,
    });

    const payload = {
      name: dto.name,
      description: dto.description ?? null,
      amount: dto.amount,
      currency: dto.currency,
      interval: dto.interval,
      interval_count: dto.interval_count,
      stripe_product_id: product.id,
      stripe_price_id: price.id,
      features: dto.features ?? null,
      metadata: dto.metadata ?? {},
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const client = this.databaseService.getClient();
    const { data, error } = await client
      .from('plans')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to persist plan: ${error.message}`,
      );
    }

    return data as Plan;
  }

  async findAll(options: QueryOptions = {}): Promise<Plan[]> {
    const client = this.databaseService.getClient();
    let query = client.from('plans').select('*').order('amount', {
      ascending: true,
    });

    if (options.onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException(
        `Failed to fetch plans: ${error.message}`,
      );
    }

    return (data || []) as Plan[];
  }

  async findOne(id: string): Promise<Plan> {
    const client = this.databaseService.getClient();
    const { data, error } = await client
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Plan with id "${id}" not found`);
    }

    return data as Plan;
  }

  async findByStripeProduct(productId: string): Promise<Plan | null> {
    const client = this.databaseService.getClient();
    const { data } = await client
      .from('plans')
      .select('*')
      .eq('stripe_product_id', productId)
      .maybeSingle();

    return (data as Plan) ?? null;
  }

  async findByStripePrice(priceId: string): Promise<Plan | null> {
    const client = this.databaseService.getClient();
    const { data } = await client
      .from('plans')
      .select('*')
      .eq('stripe_price_id', priceId)
      .maybeSingle();

    return (data as Plan) ?? null;
  }

  async update(id: string, dto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);
    const stripe = this.stripeService.getClient();

    if (dto.name || dto.description || dto.metadata) {
      await stripe.products.update(plan.stripe_product_id, {
        name: dto.name ?? undefined,
        description: dto.description ?? undefined,
        metadata: dto.metadata ?? undefined,
        active: dto.is_active ?? undefined,
      });
    }

    let stripePriceId = plan.stripe_price_id;
    const priceNeedsUpdate =
      dto.amount !== undefined ||
      dto.currency !== undefined ||
      dto.interval !== undefined ||
      dto.interval_count !== undefined;

    if (priceNeedsUpdate) {
      const price = await stripe.prices.create({
        currency: dto.currency ?? plan.currency,
        unit_amount: dto.amount ?? plan.amount,
        recurring: {
          interval: (dto.interval ??
            plan.interval) as Stripe.PriceCreateParams.Recurring.Interval,
          interval_count: dto.interval_count ?? plan.interval_count,
        },
        product: plan.stripe_product_id,
        metadata: dto.metadata ?? plan.metadata ?? undefined,
      });
      stripePriceId = price.id;
    }

    const payload = {
      name: dto.name ?? plan.name,
      description: dto.description ?? plan.description,
      amount: dto.amount ?? plan.amount,
      currency: dto.currency ?? plan.currency,
      interval: dto.interval ?? plan.interval,
      interval_count: dto.interval_count ?? plan.interval_count,
      features: dto.features ?? plan.features,
      metadata: dto.metadata ?? plan.metadata,
      is_active:
        dto.is_active !== undefined ? dto.is_active : (plan.is_active ?? true),
      stripe_price_id: stripePriceId,
      updated_at: new Date().toISOString(),
    };

    const client = this.databaseService.getClient();
    const { data, error } = await client
      .from('plans')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Failed to update plan: ${error.message}`,
      );
    }

    return data as Plan;
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    const stripe = this.stripeService.getClient();

    await stripe.products.update(plan.stripe_product_id, { active: false });

    const client = this.databaseService.getClient();
    const { error } = await client
      .from('plans')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to archive plan: ${error.message}`,
      );
    }
  }

  async syncFromPrice(price: Stripe.Price): Promise<void> {
    if (typeof price.product !== 'string') {
      return;
    }

    const productId = price.product;
    const plan = await this.findByStripeProduct(productId);
    const data = {
      name: price.nickname ?? plan?.name ?? 'Plan',
      description: plan?.description ?? null,
      amount: price.unit_amount ?? plan?.amount ?? 0,
      currency: price.currency,
      interval: price.recurring?.interval ?? plan?.interval ?? 'month',
      interval_count:
        price.recurring?.interval_count ?? plan?.interval_count ?? 1,
      stripe_product_id: productId,
      stripe_price_id: price.id,
      is_active: !price.active ? false : (plan?.is_active ?? true),
      metadata: price.metadata ?? plan?.metadata ?? {},
      updated_at: new Date().toISOString(),
    };

    const client = this.databaseService.getClient();

    if (plan) {
      await client.from('plans').update(data).eq('id', plan.id);
      return;
    }

    await client.from('plans').insert([
      {
        ...data,
        features: plan?.features ?? null,
      },
    ]);
  }

  async syncFromProduct(product: Stripe.Product): Promise<void> {
    const client = this.databaseService.getClient();
    const existing = await this.findByStripeProduct(product.id);

    if (!existing) {
      return;
    }

    await client
      .from('plans')
      .update({
        name: product.name ?? existing.name,
        description: product.description ?? existing.description,
        metadata: product.metadata ?? existing.metadata,
        is_active: product.active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  }

  async syncAllFromStripe(): Promise<{
    deleted_plans: number;
    inserted_plans: number;
    stripe_prices_processed: number;
    stripe_products_processed: number;
  }> {
    const stripe = this.stripeService.getClient();
    const plansToInsert: any[] = [];
    const productIds = new Set<string>();

    let pricesProcessed = 0;
    let startingAfter: string | undefined;

    do {
      const response = await stripe.prices.list({
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.product'],
      });

      for (const price of response.data) {
        const productResult =
          typeof price.product === 'string'
            ? await stripe.products.retrieve(price.product)
            : price.product;

        const resolvedProduct =
          productResult && 'deleted' in productResult && productResult.deleted
            ? null
            : (productResult as Stripe.Product | null);

        const productId =
          typeof price.product === 'string'
            ? price.product
            : (price.product?.id ?? null);

        if (productId) {
          productIds.add(productId);
        }

        plansToInsert.push({
          name: resolvedProduct?.name ?? price.nickname ?? 'Plan',
          description: resolvedProduct?.description ?? null,
          amount: price.unit_amount ?? 0,
          currency: price.currency,
          interval: price.recurring?.interval ?? 'month',
          interval_count: price.recurring?.interval_count ?? 1,
          stripe_product_id: productId,
          stripe_price_id: price.id,
          features: null,
          metadata: price.metadata ?? {},
          is_active: price.active ?? resolvedProduct?.active ?? true,
          updated_at: new Date().toISOString(),
        });

        pricesProcessed += 1;
      }

      if (response.has_more) {
        startingAfter =
          response.data.length > 0
            ? response.data[response.data.length - 1].id
            : undefined;
      } else {
        startingAfter = undefined;
      }
    } while (startingAfter);

    const client = this.databaseService.getClient();
    const { data: deletedRows, error: deleteError } = await client
      .from('plans')
      .delete()
      .not('id', 'is', null)
      .select('id');

    if (deleteError) {
      throw new InternalServerErrorException(
        `Failed to delete existing plans: ${deleteError.message}`,
      );
    }

    let insertedCount = 0;

    if (plansToInsert.length > 0) {
      const { data: insertedRows, error: insertError } = await client
        .from('plans')
        .insert(plansToInsert)
        .select('id');

      if (insertError) {
        throw new InternalServerErrorException(
          `Failed to insert synced plans: ${insertError.message}`,
        );
      }

      insertedCount = insertedRows?.length ?? 0;
    }

    return {
      deleted_plans: deletedRows?.length ?? 0,
      inserted_plans: insertedCount,
      stripe_prices_processed: pricesProcessed,
      stripe_products_processed: productIds.size,
    };
  }
}
