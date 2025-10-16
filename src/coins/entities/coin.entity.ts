export class Coin {
  id: string;
  name: string | null;
  sub_name: string | null;
  category: string | null;
  reference: string | null;
  material: string | null;
  origin_country: string | null;
  year: number | null;
  condition: string | null;
  gross_weight: number | null;
  net_weight: number | null;
  prime_percent: number | null;
  price_eur: number | null;
  taxation: string | null;
  vault_location: string | null;
  lsp_eligible: boolean | null;
  is_main_list: boolean | null;
  is_featured: boolean | null;
  is_deliverable: boolean | null;
  is_new: boolean | null;
  is_sold: boolean | null;
  front_picture_url: string | null;
  product_url: string | null;
  ai_score: number | null;
  scraped_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
}

