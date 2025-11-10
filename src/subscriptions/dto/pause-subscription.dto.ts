import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PauseSubscriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
