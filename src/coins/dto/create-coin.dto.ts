import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateCoinDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sub_name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  origin_country?: string;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsNumber()
  gross_weight?: number;

  @IsOptional()
  @IsNumber()
  net_weight?: number;

  @IsOptional()
  @IsNumber()
  prime_percent?: number;

  @IsOptional()
  @IsNumber()
  price_eur?: number;

  @IsOptional()
  @IsString()
  taxation?: string;

  @IsOptional()
  @IsString()
  vault_location?: string;

  @IsOptional()
  @IsBoolean()
  lsp_eligible?: boolean;

  @IsOptional()
  @IsBoolean()
  is_main_list?: boolean;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsBoolean()
  is_deliverable?: boolean;

  @IsOptional()
  @IsBoolean()
  is_new?: boolean;

  @IsOptional()
  @IsBoolean()
  is_sold?: boolean;

  @IsOptional()
  @IsString()
  front_picture_url?: string;

  @IsOptional()
  @IsString()
  product_url?: string;

  @IsOptional()
  @IsNumber()
  ai_score?: number;

  @IsOptional()
  @IsDateString()
  scraped_at?: Date;
}

