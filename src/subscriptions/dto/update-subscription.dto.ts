import { PartialType } from '@nestjs/mapped-types';
import { CreateSubscriptionDto } from './create-subscription.dto';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  IsObject,
} from 'class-validator';
import { SubscriptionStatus } from '../entities/subscription.entity';

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {
  @IsOptional()
  @IsEnum(SubscriptionStatus, {
    message: 'status must be a valid subscription status',
  })
  status?: SubscriptionStatus;

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
  pause_reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancel_reason?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
