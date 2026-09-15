import type { Model, Optional } from "sequelize";

export interface IBillingSchema {
  id: number;
  uuid: string;
  current_outstanding: number | string;
  customer_id: number;
  customer_business_id: number | null;
  business_id: number;
  business_owner_id: number;
  start_date_of_month: string;
  end_date_of_month: string;
  due_date: string;
  extend_due_date: string | null;
  generated_at: Date | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type BillingCreationSchema = Optional<
  IBillingSchema,
  | "id"
  | "uuid"
  | "current_outstanding"
  | "customer_business_id"
  | "extend_due_date"
  | "generated_at"
  | "created_by"
  | "updated_by"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

export interface IBillingModel
  extends Model<IBillingSchema, BillingCreationSchema>, IBillingSchema {}

export type BillingPaymentStatus = "unpaid" | "partial" | "paid";

export interface IBillingParty {
  uuid: string;
  name: string;
}

export interface IBillingCustomer {
  uuid: string;
  first_name: string;
  last_name: string | null;
  username: string;
}

export interface IBillingPaymentPublic {
  uuid: string;
  transition_uuid: string;
  product_name: string;
  amount_received: number;
  created_at: Date;
}

export interface IBillingPublic {
  uuid: string;
  current_outstanding: number;
  total_amount: number;
  amount_received: number;
  payment_status: BillingPaymentStatus;
  start_date_of_month: string;
  end_date_of_month: string;
  due_date: string;
  extend_due_date: string | null;
  generated_at: Date | null;
  created_at: Date;
  updated_at: Date;
  customer: IBillingCustomer | null;
  customer_business: IBillingParty | null;
  business: IBillingParty | null;
  payments: IBillingPaymentPublic[];
}

export interface IBillingListOptions {
  page: number;
  limit: number;
  paginated: boolean;
  year?: number;
  month?: number;
}

export interface IBillingPage {
  items: IBillingPublic[];
  total: number;
}

export interface IRecordBillingPaymentPayload {
  amount: number;
}

export interface IExtendBillingDueDatePayload {
  extend_due_date: string;
}

export interface IGenerateBillingPayload {
  due_date: string;
}
