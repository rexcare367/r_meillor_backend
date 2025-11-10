import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsIn,
  IsUUID,
  MaxLength,
  Min,
  IsObject,
} from 'class-validator';

const BILLING_INTERVALS = ['day', 'week', 'month', 'year'] as const;

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @IsPositive()
  amount: number; // cents

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  currency: string = 'usd';

  @IsIn(BILLING_INTERVALS as unknown as string[])
  interval: (typeof BILLING_INTERVALS)[number] = 'month';

  @IsInt()
  @Min(1)
  interval_count: number = 1;

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
  @IsUUID('4', { each: false })
  trial_plan_id?: string;
}
