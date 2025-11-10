import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  @IsNotEmpty()
  stripe_price_id: string;

  @IsString()
  @IsNotEmpty()
  success_url: string;

  @IsString()
  @IsNotEmpty()
  cancel_url: string;
}


