import type { Model, Optional } from "sequelize";

export type CustomerRequestStatus = "pending" | "approved" | "rejected";

export interface ICustomerManagementSchema {
  id: number;
  uuid: string;
  connect_user_id: number;
  request_status: CustomerRequestStatus;
  business_id: number;
  source_business_id: number | null;
  role: string;
  updated_by: number | null;
  deleted_by: number | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type CustomerManagementCreationSchema = Optional<
  ICustomerManagementSchema,
  | "id"
  | "uuid"
  | "request_status"
  | "source_business_id"
  | "updated_by"
  | "deleted_by"
  | "created_by"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

export interface ICustomerManagementModel
  extends
    Model<ICustomerManagementSchema, CustomerManagementCreationSchema>,
    ICustomerManagementSchema {}

export type ICustomerManagementPayload = Pick<
  ICustomerManagementSchema,
  "connect_user_id" | "business_id" | "role"
> & { source_business_uuid?: string };

export type ICustomerManagementCreateData = ICustomerManagementPayload & {
  created_by: number;
  source_business_id: number | null;
};

export type ICustomerManagementUpdatePayload = Partial<ICustomerManagementPayload>;

export type ICustomerManagementUpdateData = ICustomerManagementUpdatePayload & {
  updated_by: number;
};

export interface IConnectCustomerPayload {
  business_uuid: string;
  user_id: number;
}

export interface IConnectionRequestResponsePayload {
  request_status: Exclude<CustomerRequestStatus, "pending">;
}

export interface ICustomerSearchResult {
  uuid: string;
  user_id: number;
  first_name: string;
  last_name: string | null;
  email: string;
  username: string;
  phone: string;
  dial_code: string | null;
}
