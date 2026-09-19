import type { Model, Optional } from "sequelize";

export type RecurringTransactionType = "product" | "service";
export type RecurringTransactionWeekday =
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface IRecurringTransactionTimeRange {
  start_time: string;
  end_time: string;
}

export interface IRecurringTransactionConfigSchema {
  id: number;
  uuid: string;
  business_id: number | null;
  customer_id: number | null;
  customer_business_id: number | null;
  type: RecurringTransactionType;
  name: string;
  unit_id: number | null;
  quantity: number | string | null;
  unit_price: number | string;
  total_price: number | string;
  week_days: RecurringTransactionWeekday[];
  time_ranges: IRecurringTransactionTimeRange[];
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type RecurringTransactionConfigCreationSchema = Optional<
  IRecurringTransactionConfigSchema,
  | "id"
  | "uuid"
  | "unit_id"
  | "quantity"
  | "customer_id"
  | "customer_business_id"
  | "created_by"
  | "updated_by"
  | "deleted_by"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

export interface IRecurringTransactionConfigModel
  extends
    Model<IRecurringTransactionConfigSchema, RecurringTransactionConfigCreationSchema>,
    IRecurringTransactionConfigSchema {}

export interface IRecurringTransactionConfigPayload {
  business_uuid?: string;
  customer_id?: number;
  customer_business_uuid?: string;
  type: RecurringTransactionType;
  name: string;
  unit_id: number | null;
  quantity: number | null;
  unit_price: number;
  week_days: RecurringTransactionWeekday[];
  time_ranges: IRecurringTransactionTimeRange[];
}

export type IRecurringTransactionConfigUpdatePayload = Omit<
  IRecurringTransactionConfigPayload,
  "business_uuid" | "customer_id" | "customer_business_uuid"
>;

export interface IRecurringTransactionConfigPublic {
  id: number;
  uuid: string;
  created_by: number | null;
  is_creator: boolean;
  type: RecurringTransactionType;
  name: string;
  unit_id: number | null;
  quantity: number | null;
  unit_price: number;
  total_price: number;
  week_days: RecurringTransactionWeekday[];
  time_ranges: IRecurringTransactionTimeRange[];
  created_at: Date;
  updated_at: Date;
  customer: {
    id: number;
    uuid: string;
    first_name: string;
    last_name: string | null;
    username: string;
  } | null;
  creator: {
    id: number;
    uuid: string;
    first_name: string;
    last_name: string | null;
    username: string;
  } | null;
  business: { uuid: string; name: string } | null;
  customer_business: { uuid: string; name: string } | null;
  unit: { id: number; uuid: string; name: string; code: string } | null;
}
