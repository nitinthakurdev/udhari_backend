import type { Model, Optional } from "sequelize";

export const SUBSCRIPTION_DURATION_TYPES = ["MONTHLY", "YEARLY", "QUARTERLY"] as const;

export type SubscriptionDurationType = (typeof SUBSCRIPTION_DURATION_TYPES)[number];

export interface ISubscriptionConfig {
  allowed_users: number;
}

export interface ISubscriptionSchema {
  id: number;
  uuid: string;
  name: string;
  description: string;
  features: string[];
  price: number | string;
  currency: string;
  duration: number;
  duration_type: SubscriptionDurationType;
  is_active: boolean;
  config: ISubscriptionConfig;
  role_id: number;
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type SubscriptionCreationSchema = Optional<
  ISubscriptionSchema,
  | "id"
  | "uuid"
  | "currency"
  | "duration_type"
  | "is_active"
  | "config"
  | "created_by"
  | "updated_by"
  | "deleted_by"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

export interface ISubscriptionModel
  extends Model<ISubscriptionSchema, SubscriptionCreationSchema>, ISubscriptionSchema {}

export type ISubscriptionCreatePayload = Pick<
  ISubscriptionSchema,
  "name" | "description" | "features" | "duration" | "role_id"
> & {
  price: number;
} & Partial<Pick<ISubscriptionSchema, "currency" | "duration_type" | "is_active" | "created_by">>;

export type ISubscriptionUpdatePayload = Partial<
  Pick<
    ISubscriptionSchema,
    | "name"
    | "description"
    | "features"
    | "currency"
    | "duration"
    | "duration_type"
    | "is_active"
    | "role_id"
  >
> & {
  price?: number;
};

export type ISubscriptionUpdateData = ISubscriptionUpdatePayload &
  Partial<Pick<ISubscriptionSchema, "updated_by">>;

export type ISubscriptionPublic = Pick<
  ISubscriptionSchema,
  | "uuid"
  | "name"
  | "description"
  | "features"
  | "currency"
  | "duration"
  | "duration_type"
  | "is_active"
  | "role_id"
  | "created_at"
  | "updated_at"
> & {
  price: number;
};

export type ISubscriptionPricingPlan = ISubscriptionPublic & {
  role: { name: string; slug: "user" | "business" };
};
