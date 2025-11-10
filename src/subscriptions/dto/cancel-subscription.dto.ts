import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class CancelSubscriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsUrl({}, { message: 'stripe_invoice_url must be a valid URL' })
  stripe_invoice_url?: string;
}
