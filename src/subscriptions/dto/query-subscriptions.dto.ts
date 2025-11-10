import {
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionStatus } from '../entities/subscription.entity';

export class QuerySubscriptionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsEnum(SubscriptionStatus, {
    message: 'status must be a valid subscription status',
  })
  status?: SubscriptionStatus;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsUUID('4')
  plan_id?: string;

  @IsOptional()
  @IsString()
  stripe_subscription_id?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsISO8601()
  started_from?: string;

  @IsOptional()
  @IsISO8601()
  started_to?: string;
}
