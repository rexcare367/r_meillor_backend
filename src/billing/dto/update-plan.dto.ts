import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanDto } from './create-plan.dto';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';

const BILLING_INTERVALS = ['day', 'week', 'month', 'year'] as const;

export class UpdatePlanDto extends PartialType(CreatePlanDto) {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsIn(BILLING_INTERVALS as unknown as string[])
  interval?: (typeof BILLING_INTERVALS)[number];

  @IsOptional()
  @IsInt()
  @IsPositive()
  interval_count?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(25)
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
