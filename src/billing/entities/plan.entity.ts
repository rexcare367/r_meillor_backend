export class Plan {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  stripe_product_id: string;
  stripe_price_id: string;
  features: string[] | null;
  is_active: boolean;
  metadata: Record<string, any>;
}
