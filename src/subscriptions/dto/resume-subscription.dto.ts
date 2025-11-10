import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class ResumeSubscriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  plan?: string;

  @IsOptional()
  @IsUrl({}, { message: 'stripe_invoice_url must be a valid URL' })
  stripe_invoice_url?: string;
}
