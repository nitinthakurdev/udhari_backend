import type { Model, Optional } from "sequelize";

export const PAYMENT_PROVIDERS = ["MANUAL", "FREE", "RAZORPAY", "GOOGLE_PLAY"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export interface IUserSubscriptionSchema {
  id: number;
  uuid: string;
  user_id: number;
  subscription_id: number;
  expiry_at: Date;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  google_play_purchase_token: string | null;
  google_play_order_id: string | null;
  payment_provider: PaymentProvider;
  auto_renew: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type UserSubscriptionCreationSchema = Optional<
  IUserSubscriptionSchema,
  | "id"
  | "uuid"
  | "razorpay_order_id"
  | "razorpay_payment_id"
  | "google_play_purchase_token"
  | "google_play_order_id"
  | "payment_provider"
  | "auto_renew"
  | "created_by"
  | "updated_by"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

export interface IUserSubscriptionModel
  extends Model<IUserSubscriptionSchema, UserSubscriptionCreationSchema>, IUserSubscriptionSchema {}

export interface IUserSubscriptionCreatePayload {
  user_uuid: string;
  subscription_uuid: string;
  expiry_at: Date;
}

export type IUserSubscriptionUpdatePayload = Partial<
  Pick<IUserSubscriptionCreatePayload, "subscription_uuid" | "expiry_at">
>;

export type IUserSubscriptionCreateData = Pick<
  IUserSubscriptionSchema,
  "user_id" | "subscription_id" | "expiry_at" | "created_by"
> &
  Partial<Pick<IUserSubscriptionSchema, "payment_provider" | "auto_renew">>;

export type IUserSubscriptionUpdateData = Partial<
  Pick<
    IUserSubscriptionSchema,
    "subscription_id" | "expiry_at" | "payment_provider" | "auto_renew" | "updated_by"
  >
>;

export interface IUserSubscriptionPublic {
  uuid: string;
  expiry_at: Date;
  created_at: Date;
  updated_at: Date;
  payment_provider: PaymentProvider;
  auto_renew: boolean;
  user: {
    uuid: string;
    first_name: string;
    last_name: string | null;
    email: string;
    username: string;
  };
  subscription: {
    uuid: string;
    name: string;
    description: string;
    features: string[];
    config: {
      allowed_transitions: number;
      allowed_connected_customers: number;
      allowed_connected_businesses: number;
      allowed_connected_users: number;
      allowed_managed_businesses: number;
    };
    price: number;
    currency: string;
    duration: number;
    duration_type: string;
    is_active: boolean;
    auto_renewal_enabled: boolean;
  };
}
