import type { Model, Optional } from "sequelize";
import type { IUnitSchema } from "@/types/unitTypes";

export type TransitionRequestStatus =
  "pending" | "approved" | "rejected" | "not_available" | "cancelled";
export type TransitionBalanceType = "payable" | "receivable";
export type TransitionPaymentStatus = "unpaid" | "partial" | "paid";

export interface ITransitionSchema {
  id: number;
  uuid: string;
  customer_user_id: number;
  customer_business_id: number | null;
  business_id: number | null;
  business_user_id: number;
  unit_id: number | null;
  product_name: string;
  product_qty: number | string;
  product_unit_price: number | string;
  total_price: number | string;
  request_status: TransitionRequestStatus;
  balance_type: TransitionBalanceType;
  comment: string | null;
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  recurring_config_id: number | null;
  schedule_occurrence_key: string | null;
}

export type TransitionCreationSchema = Optional<
  ITransitionSchema,
  | "id"
  | "uuid"
  | "product_qty"
  | "customer_business_id"
  | "total_price"
  | "request_status"
  | "balance_type"
  | "comment"
  | "created_by"
  | "updated_by"
  | "deleted_by"
  | "created_at"
  | "updated_at"
  | "deleted_at"
  | "recurring_config_id"
  | "schedule_occurrence_key"
>;

export interface ITransitionModel
  extends Model<ITransitionSchema, TransitionCreationSchema>, ITransitionSchema {}

export type ITransitionCreatePayload = Pick<
  ITransitionSchema,
  "product_name" | "product_unit_price" | "total_price"
> &
  Partial<
    Pick<ITransitionSchema, "customer_user_id" | "customer_business_id" | "product_qty" | "comment">
  > & {
    business_id: number;
    unit_id: number | null;
    customer_business_uuid?: string;
    balance_type?: TransitionBalanceType;
  };

export type ITransitionCreateData = Omit<ITransitionCreatePayload, "business_id" | "unit_id"> & {
  business_id: number | null;
  unit_id: number | null;
  customer_user_id: number;
  customer_business_id: number | null;
  business_user_id: number;
  request_status: "pending";
  balance_type: TransitionBalanceType;
  created_by: number;
  recurring_config_id?: number | null;
  schedule_occurrence_key?: string | null;
};

export type ITransitionBatchItem = Pick<
  ITransitionSchema,
  "product_name" | "product_unit_price" | "total_price"
> &
  Partial<Pick<ITransitionSchema, "product_qty" | "comment">> & {
    unit_id: number | null;
  };

export type ITransitionBatchCreatePayload = Pick<
  ITransitionCreatePayload,
  "business_id" | "customer_user_id" | "customer_business_uuid" | "balance_type"
> & {
  items: ITransitionBatchItem[];
};

export type ITransitionUpdatePayload = Partial<
  Pick<
    ITransitionSchema,
    | "product_name"
    | "unit_id"
    | "product_qty"
    | "product_unit_price"
    | "total_price"
    | "request_status"
    | "balance_type"
    | "comment"
  >
>;

export type ITransitionUpdateData = ITransitionUpdatePayload & { updated_by: number };

export type ITransitionPublic = Pick<
  ITransitionSchema,
  | "uuid"
  | "customer_user_id"
  | "customer_business_id"
  | "business_id"
  | "business_user_id"
  | "unit_id"
  | "product_name"
  | "product_qty"
  | "product_unit_price"
  | "request_status"
  | "balance_type"
  | "comment"
  | "created_by"
  | "updated_by"
  | "created_at"
  | "updated_at"
  | "recurring_config_id"
  | "schedule_occurrence_key"
> & {
  product_unit_price: number;
  total_price: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: TransitionPaymentStatus;
  account_type: TransitionBalanceType;
  unit: Pick<IUnitSchema, "name" | "code"> | null;
};

export interface ITransitionAccess {
  customerExists: boolean;
  businessExists: boolean;
  businessUserId: number | null;
  connectionExists: boolean;
  canAccess: boolean;
  isCustomer: boolean;
  isBusinessOwner: boolean;
}

export interface ITransitionListOptions {
  page: number;
  limit: number;
  paginated: boolean;
  view: "all" | "pending" | "unpaid" | "cancelled";
  partyType?: "user" | "business";
  partyId?: number;
}

export interface ITransitionPage {
  items: ITransitionPublic[];
  total: number;
}

export interface ITransitionBalanceParty {
  party_type: "user" | "business";
  party_id: number;
  account_type: TransitionBalanceType;
  amount: number;
}

export interface ITransitionBalanceSummary {
  payable: number;
  receivable: number;
  parties: ITransitionBalanceParty[];
}
