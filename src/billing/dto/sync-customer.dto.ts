import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  IsObject,
} from 'class-validator';

export class SyncCustomerDto {
  @IsOptional()
  @IsUUID('4')
  user_id?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
