import { IsNotEmpty, IsObject } from 'class-validator';

export class UpdateCustomerMetadataDto {
  @IsObject()
  @IsNotEmpty()
  metadata: Record<string, any>;
}
