import type { Model, Optional } from "sequelize";

export interface ICustomerManagementSchema {
  id: number;
  uuid: string;
  connect_user_id: number;
  business_id: number;
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
  "id" | "uuid" | "updated_by" | "deleted_by" | "created_at" | "updated_at" | "deleted_at"
>;

export interface ICustomerManagementModel
  extends
    Model<ICustomerManagementSchema, CustomerManagementCreationSchema>,
    ICustomerManagementSchema {}

export interface ICustomerManagementPayload {
  connect_user_id: number;
  business_id: number;
  role: string;
  created_by: number;
}
