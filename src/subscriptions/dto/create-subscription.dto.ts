import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  IsISO8601,
  IsObject,
  IsUUID,
  Min,
} from 'class-validator';
import { SubscriptionStatus } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @IsOptional()
  @IsString()
  @IsUUID('4')
  user_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  plan?: string;

  @IsOptional()
  @IsUUID('4')
  plan_id?: string;

  @IsOptional()
  @IsString()
  stripe_price_id?: string;

  @IsOptional()
  @IsEnum(SubscriptionStatus, {
    message: 'status must be a valid subscription status',
  })
  status?: SubscriptionStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  trial_period_days?: number;

  @IsOptional()
  @IsISO8601()
  started_at?: string;

  @IsOptional()
  @IsISO8601()
  ended_at?: string;

  @IsOptional()
  @IsUrl({}, { message: 'stripe_invoice_url must be a valid URL' })
  stripe_invoice_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
