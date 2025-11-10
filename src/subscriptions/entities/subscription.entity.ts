export enum SubscriptionStatus {
  Active = 'active',
  Trialing = 'trialing',
  PastDue = 'past_due',
  Paused = 'paused',
  Canceled = 'canceled',
  Expired = 'expired',
  Incomplete = 'incomplete',
  IncompleteExpired = 'incomplete_expired',
  Unpaid = 'unpaid',
}

export class Subscription {
  id: string;
  created_at: string;
  user_id: string;
  plan: string | null;
  plan_id: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: SubscriptionStatus;
  started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  ended_at: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  stripe_invoice_url: string | null;
  pause_reason: string | null;
  cancel_reason: string | null;
  metadata: Record<string, any>;
  last_event_at: string | null;
}
